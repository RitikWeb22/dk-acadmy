import type { Request, Response } from 'express';
import crypto from 'crypto';
import { razorpayInstance } from '../config/razorpay.js';
import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
import { Course } from '../models/Course.js';
import type { AuthRequest } from '../middlewares/authMiddleware.js';
import { broadcastPaymentSuccess, broadcastCMSUpdated } from '../sockets/socket.js';

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { amount, courseId, courseTitle, studentName, studentEmail, studentPhone } = req.body;

    if (!amount) {
      res.status(400).json({ success: false, message: 'Please provide payment amount' });
      return;
    }

    const options = {
      amount: Math.round(Number(amount) * 100), // convert to paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      notes: {
        courseId: courseId || '',
        courseTitle: courseTitle || '',
        studentId: req.user?._id?.toString() || 'guest'
      }
    };

    let order: any;
    let isMock = false;

    try {
      order = await razorpayInstance.orders.create(options);
    } catch (rzpErr: any) {
      console.warn('[Razorpay API Warning]:', rzpErr.error?.description || rzpErr.message, '- Using seamless development test order.');
      order = {
        id: `order_test_${Date.now()}`,
        entity: 'order',
        amount: options.amount,
        amount_paid: 0,
        amount_due: options.amount,
        currency: 'INR',
        receipt: options.receipt,
        status: 'created',
        attempts: 0,
        notes: options.notes,
        created_at: Math.floor(Date.now() / 1000)
      };
      isMock = true;
    }

    // Persist order in MongoDB
    try {
      await Order.create({
        orderId: order.id,
        userId: req.user?._id,
        studentName: studentName || req.user?.name || 'Student Aspirant',
        studentEmail: studentEmail || req.user?.email || 'student@dkacademy.com',
        studentPhone: studentPhone || req.user?.phone,
        courseId: courseId || 'general',
        courseTitle: courseTitle || 'JEE Academic Cohort',
        amount: Number(amount),
        currency: 'INR',
        status: 'PENDING',
        paymentGateway: isMock ? 'Direct' : 'Razorpay',
        notes: options.notes
      });
    } catch (dbErr) {
      console.error('[Order DB Error]:', dbErr);
    }

    res.status(200).json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID || '',
      isMock
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      courseId
    } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET;
    let isValid = false;

    if (secret && razorpay_order_id && razorpay_payment_id && razorpay_signature) {
      try {
        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
          .createHmac('sha256', secret)
          .update(body)
          .digest('hex');

        const expectedBuf = Buffer.from(expectedSignature, 'utf8');
        const receivedBuf = Buffer.from(String(razorpay_signature), 'utf8');

        // Timing-safe comparison prevents timing attacks on HMAC signatures
        if (expectedBuf.length === receivedBuf.length && crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
          isValid = true;
        }
      } catch {
        isValid = false;
      }
    }

    // In production, reject any non-cryptographically verified payments
    const isProduction = process.env.NODE_ENV === 'production';
    const isDevMockAllowed =
      !isProduction &&
      (razorpay_signature === 'mock_signature' ||
        razorpay_order_id?.startsWith('order_test_') ||
        razorpay_order_id?.startsWith('order_mock_') ||
        !secret);

    if (isValid || isDevMockAllowed) {
      // 1. Update Order status in MongoDB
      let updatedOrder = null;
      if (razorpay_order_id) {
        updatedOrder = await Order.findOneAndUpdate(
          { orderId: razorpay_order_id },
          {
            status: 'SUCCESS',
            paymentId: razorpay_payment_id || `pay_verified_${Date.now()}`,
            signature: razorpay_signature
          },
          { new: true }
        );
      }

      // 2. Enroll user in Course
      if (courseId) {
        if (req.user) {
          const courses = req.user.enrolledCourses || [];
          if (!courses.map((c) => c.toString()).includes(courseId)) {
            courses.push(courseId as any);
            req.user.enrolledCourses = courses;
            await req.user.save();
          }
        }

        // Increment course enrolment count
        try {
          await Course.findByIdAndUpdate(courseId, { $inc: { enrolmentCount: 1 } });
        } catch {
          await Course.findOneAndUpdate({ slug: courseId }, { $inc: { enrolmentCount: 1 } });
        }
      }

      // 3. Broadcast real-time payment success via WebSockets
      broadcastPaymentSuccess({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id || `pay_verified_${Date.now()}`,
        courseId,
        studentName: updatedOrder?.studentName || req.user?.name || 'Enrolled Student',
        studentEmail: updatedOrder?.studentEmail || req.user?.email || 'student@dkacademy.com',
        amount: updatedOrder?.amount || 0,
        status: 'SUCCESS',
        timestamp: Date.now()
      });
      broadcastCMSUpdated('courses', courseId);

      res.status(200).json({
        success: true,
        message: 'Payment verified and enrollment confirmed',
        paymentId: razorpay_payment_id || `pay_test_${Date.now()}`,
        order: updatedOrder
      });
      return;
    }

    res.status(400).json({ success: false, message: 'Invalid payment signature' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all verified orders for Admin Dashboard & Purchases Table
 */
export const getOrdersList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, courseId, limit = 50, page = 1 } = req.query;
    const filter: Record<string, any> = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (courseId && courseId !== 'ALL') {
      filter.courseId = courseId;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Order.countDocuments(filter);

    // Calculate aggregated metrics
    const [stats] = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalGrossRevenue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'SUCCESS'] }, '$amount', 0]
            }
          },
          totalRefunds: {
            $sum: '$refundAmount'
          },
          successfulCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'SUCCESS'] }, 1, 0]
            }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      },
      summary: {
        totalGrossRevenue: stats?.totalGrossRevenue || 0,
        totalRefunds: stats?.totalRefunds || 0,
        netRevenue: (stats?.totalGrossRevenue || 0) - (stats?.totalRefunds || 0),
        successfulCount: stats?.successfulCount || 0
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get authentic student enrolled orders and receipts
 */
export const getMyOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const email = req.user?.email;

    const query: Record<string, any> = {};
    if (userId && email) {
      query.$or = [{ userId }, { studentEmail: email }];
    } else if (userId) {
      query.userId = userId;
    } else if (email) {
      query.studentEmail = email;
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create a manual offline fee slip / invoice directly in MongoDB Order model
 */
export const createAdminInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      studentName,
      studentEmail,
      studentPhone,
      rollNo,
      courseTitle,
      courseId,
      amount,
      centerType,
      paymentChannel,
      paymentRef,
      paymentStatus,
      installmentNote
    } = req.body;

    if (!studentName || !amount) {
      res.status(400).json({ success: false, message: 'Student name and gross amount are required' });
      return;
    }

    const orderCount = await Order.countDocuments();
    const invoiceNo = `INV-2026-${String(843 + orderCount).padStart(4, '0')}`;
    const orderId = `ord_manual_${Date.now()}`;
    const paymentId = paymentRef || `pay_cash_${Date.now()}`;

    const newOrder = await Order.create({
      orderId,
      paymentId,
      studentName,
      studentEmail: studentEmail || `student.${String(rollNo || Date.now()).replace(/[^0-9]/g, '')}@dkacademy.com`,
      studentPhone: studentPhone || '+91 98765 43210',
      courseId: courseId || 'general',
      courseTitle: courseTitle || 'JEE Ultimate Classroom',
      amount: Number(amount),
      currency: 'INR',
      status: paymentStatus === 'PARTIAL' ? 'PENDING' : 'SUCCESS',
      paymentGateway: paymentChannel === 'Cash Desk' ? 'Direct' : paymentChannel || 'Manual',
      notes: {
        invoiceNo,
        rollNo,
        centerType: centerType || 'Janakpuri HQ',
        paymentChannel: paymentChannel || 'Cash Desk',
        installmentNote
      }
    });

    const payload = {
      orderId: newOrder.orderId,
      paymentId: newOrder.paymentId,
      studentName: newOrder.studentName,
      studentEmail: newOrder.studentEmail,
      courseTitle: newOrder.courseTitle,
      amount: newOrder.amount,
      status: newOrder.status,
      paymentGateway: newOrder.paymentGateway,
      createdAt: newOrder.createdAt,
      notes: newOrder.notes
    };

    broadcastPaymentSuccess(payload);

    res.status(201).json({
      success: true,
      message: `Invoice ${invoiceNo} issued and saved to database successfully`,
      data: newOrder
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update Order/Invoice status
 */
export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, refundAmount } = req.body;
    const updateData: any = {};
    if (status) updateData.status = status;
    if (refundAmount !== undefined) updateData.refundAmount = Number(refundAmount);

    const order = await Order.findByIdAndUpdate(id, updateData, { new: true });
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    broadcastPaymentSuccess({
      orderId: order.orderId,
      paymentId: order.paymentId,
      studentName: order.studentName,
      amount: order.amount,
      status: order.status,
      courseTitle: order.courseTitle,
      timestamp: Date.now()
    });

    res.status(200).json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete / Void Order
 */
export const deleteOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const order = await Order.findByIdAndDelete(id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }
    broadcastCMSUpdated('orders', String(id));
    res.status(200).json({ success: true, message: 'Order deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
