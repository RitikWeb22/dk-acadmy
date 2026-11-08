import crypto from 'crypto';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { razorpayInstance } from '../config/razorpay.js';
import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
import { Course } from '../models/Course.js';
import { TestSeries } from '../models/TestSeries.js';
import { Coupon } from '../models/Coupon.js';
import { WebhookEvent } from '../models/WebhookEvent.js';
import { broadcastPaymentSuccess, broadcastCMSUpdated } from '../sockets/socket.js';
export const createOrder = async (req, res) => {
    try {
        const { amount, courseId, courseTitle, studentName, studentEmail, studentPhone, couponCode } = req.body;
        const numericAmount = Number(amount);
        if (!numericAmount || numericAmount <= 0 || isNaN(numericAmount)) {
            res.status(400).json({ success: false, message: 'Please provide valid payment amount' });
            return;
        }
        // Verify price against Database if courseId or testId is provided
        if (courseId && courseId !== 'general') {
            const isOid = mongoose.isValidObjectId(courseId);
            const course = await Course.findOne({
                $or: [
                    ...(isOid ? [{ _id: courseId }] : []),
                    { slug: courseId }
                ]
            });
            let targetItem = null;
            if (course && typeof course.price === 'number') {
                targetItem = { title: course.title, price: course.price };
            }
            else {
                const test = await TestSeries.findOne({
                    $or: [
                        ...(isOid ? [{ _id: courseId }] : []),
                        { id: courseId },
                        { slug: courseId }
                    ]
                });
                if (test && typeof test.price === 'number') {
                    targetItem = { title: test.title, price: test.price };
                }
            }
            if (targetItem && targetItem.price > 0) {
                let expectedPrice = targetItem.price;
                if (couponCode) {
                    const formattedCode = String(couponCode).trim().toUpperCase();
                    const coupon = await Coupon.findOne({ code: formattedCode, isActive: true });
                    if (coupon) {
                        const isNotExpired = !coupon.expiryDate || new Date(coupon.expiryDate) > new Date();
                        const withinUsageLimit = !coupon.usageLimit || coupon.usedCount < coupon.usageLimit;
                        const meetsMinPrice = !coupon.minCoursePrice || targetItem.price >= coupon.minCoursePrice;
                        if (isNotExpired && withinUsageLimit && meetsMinPrice) {
                            let discount = 0;
                            if (coupon.discountType === 'percent') {
                                discount = (targetItem.price * coupon.discountValue) / 100;
                                if (coupon.maxDiscountAmount) {
                                    discount = Math.min(discount, coupon.maxDiscountAmount);
                                }
                            }
                            else {
                                discount = coupon.discountValue;
                            }
                            expectedPrice = Math.max(0, targetItem.price - discount);
                        }
                    }
                }
                // Price manipulation guard: student cannot pay less than verified expected price
                if (numericAmount < Math.floor(expectedPrice)) {
                    res.status(400).json({
                        success: false,
                        message: `Invalid payment amount: Expected at least ₹${Math.floor(expectedPrice)} for "${targetItem.title}", but received ₹${numericAmount}. Price tampering detected.`
                    });
                    return;
                }
            }
        }
        const options = {
            amount: Math.round(numericAmount * 100), // convert to paise
            currency: 'INR',
            receipt: `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            notes: {
                courseId: courseId || '',
                courseTitle: courseTitle || '',
                studentId: req.user?._id?.toString() || 'guest'
            }
        };
        let order;
        try {
            order = await razorpayInstance.orders.create(options);
        }
        catch (rzpErr) {
            console.error('[Razorpay Order Creation Failed]:', rzpErr.error?.description || rzpErr.message);
            res.status(502).json({
                success: false,
                message: 'Failed to create payment order with payment gateway',
                error: rzpErr.error?.description || rzpErr.message
            });
            return;
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
                paymentGateway: 'Razorpay',
                notes: options.notes
            });
        }
        catch (dbErr) {
            console.error('[Order DB Error]:', dbErr);
        }
        res.status(200).json({
            success: true,
            order,
            key: env.RAZORPAY_KEY_ID
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId } = req.body;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            res.status(400).json({
                success: false,
                message: 'Missing required payment verification parameters'
            });
            return;
        }
        const secret = env.RAZORPAY_KEY_SECRET;
        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');
        const expectedBuf = Buffer.from(expectedSignature, 'utf8');
        const receivedBuf = Buffer.from(String(razorpay_signature), 'utf8');
        // Timing-safe comparison prevents timing attacks on HMAC signatures
        if (expectedBuf.length !== receivedBuf.length || !crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
            res.status(400).json({ success: false, message: 'Invalid payment signature' });
            return;
        }
        // Confirm the order exists in the DB and belongs to req.user (if user is authenticated)
        const existingOrder = await Order.findOne({ orderId: razorpay_order_id });
        if (!existingOrder) {
            res.status(404).json({ success: false, message: 'Order record not found in system' });
            return;
        }
        if (req.user && existingOrder.userId && existingOrder.userId.toString() !== req.user._id.toString()) {
            res.status(403).json({
                success: false,
                message: 'Security violation: Order belongs to a different student account'
            });
            return;
        }
        // 1. Update Order status in MongoDB (Idempotency check)
        const wasAlreadySuccess = existingOrder.status === 'SUCCESS';
        existingOrder.status = 'SUCCESS';
        existingOrder.paymentId = razorpay_payment_id;
        existingOrder.signature = razorpay_signature;
        await existingOrder.save();
        // 2. Enroll user in Course (server-side verified only)
        if (courseId && existingOrder.courseId && existingOrder.courseId !== 'general' && existingOrder.courseId !== courseId) {
            res.status(400).json({
                success: false,
                message: 'Security violation: Course ID does not match order record'
            });
            return;
        }
        const targetCourseId = existingOrder.courseId || courseId;
        const targetUserId = req.user?._id || existingOrder.userId;
        if (!wasAlreadySuccess && targetCourseId && targetUserId) {
            const studentToEnroll = (req.user && typeof req.user.save === 'function')
                ? req.user
                : await User.findById(targetUserId);
            if (studentToEnroll) {
                const courses = studentToEnroll.enrolledCourses || [];
                if (!courses.map((c) => c.toString()).includes(targetCourseId.toString())) {
                    courses.push(targetCourseId);
                    studentToEnroll.enrolledCourses = courses;
                    await studentToEnroll.save();
                }
            }
            // Increment course enrolment count
            try {
                await Course.findByIdAndUpdate(targetCourseId, { $inc: { enrolmentCount: 1 } });
            }
            catch {
                await Course.findOneAndUpdate({ slug: targetCourseId }, { $inc: { enrolmentCount: 1 } });
            }
        }
        // 3. Broadcast real-time payment success via WebSockets
        broadcastPaymentSuccess({
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            courseId: targetCourseId,
            studentName: existingOrder.studentName || req.user?.name || 'Enrolled Student',
            studentEmail: existingOrder.studentEmail || req.user?.email || 'student@dkacademy.com',
            amount: existingOrder.amount || 0,
            status: 'SUCCESS',
            timestamp: Date.now()
        });
        if (targetCourseId) {
            broadcastCMSUpdated('courses', targetCourseId);
        }
        res.status(200).json({
            success: true,
            message: 'Payment verified and enrollment confirmed',
            paymentId: razorpay_payment_id,
            order: existingOrder
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// In-memory bounded cache for fast deduplication + fallback
const processedWebhookEvents = new Set();
/**
 * Razorpay Webhook Handler
 * Verifies X-Razorpay-Signature using RAZORPAY_WEBHOOK_SECRET against raw request body
 * Enforces idempotency via WebhookEvent collection and memory cache
 */
export const handleRazorpayWebhook = async (req, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        if (!signature) {
            res.status(400).json({ success: false, message: 'Missing X-Razorpay-Signature header' });
            return;
        }
        const secret = env.RAZORPAY_WEBHOOK_SECRET;
        const rawBody = Buffer.isBuffer(req.body)
            ? req.body
            : Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body), 'utf8');
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(rawBody)
            .digest('hex');
        const expectedBuf = Buffer.from(expectedSignature, 'utf8');
        const receivedBuf = Buffer.from(signature, 'utf8');
        if (expectedBuf.length !== receivedBuf.length || !crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
            res.status(400).json({ success: false, message: 'Invalid webhook signature' });
            return;
        }
        // Safe payload parse
        const payload = JSON.parse(rawBody.toString('utf8'));
        const eventId = req.headers['x-razorpay-event-id'] || payload.event_id || payload.id;
        if (eventId) {
            if (processedWebhookEvents.has(eventId)) {
                res.status(200).json({ success: true, message: 'Event already processed (idempotent)' });
                return;
            }
            processedWebhookEvents.add(eventId);
            if (processedWebhookEvents.size > 10000) {
                const oldest = processedWebhookEvents.values().next().value;
                if (oldest)
                    processedWebhookEvents.delete(oldest);
            }
            if (mongoose.connection.readyState === 1) {
                const alreadyProcessed = await WebhookEvent.findOne({ eventId });
                if (alreadyProcessed) {
                    res.status(200).json({ success: true, message: 'Event already processed (idempotent)' });
                    return;
                }
                await WebhookEvent.create({
                    eventId,
                    eventType: payload.event || 'unknown',
                    payload
                });
            }
        }
        // Process event types if DB is ready
        if ((payload.event === 'order.paid' || payload.event === 'payment.captured') && mongoose.connection.readyState === 1) {
            const paymentEntity = payload.payload?.payment?.entity;
            const orderId = paymentEntity?.order_id;
            const paymentId = paymentEntity?.id;
            if (orderId) {
                const order = await Order.findOne({ orderId });
                if (order) {
                    const wasAlreadySuccess = order.status === 'SUCCESS';
                    order.status = 'SUCCESS';
                    if (paymentId)
                        order.paymentId = paymentId;
                    await order.save();
                    // Only increment course count if not previously verified by /verify
                    if (!wasAlreadySuccess && order.userId && order.courseId) {
                        await User.findByIdAndUpdate(order.userId, {
                            $addToSet: { enrolledCourses: order.courseId }
                        });
                        await Course.findByIdAndUpdate(order.courseId, { $inc: { enrolmentCount: 1 } });
                    }
                }
            }
        }
        else if (payload.event === 'payment.failed' && mongoose.connection.readyState === 1) {
            const paymentEntity = payload.payload?.payment?.entity;
            const orderId = paymentEntity?.order_id;
            if (orderId) {
                const order = await Order.findOne({ orderId });
                if (order && order.status !== 'SUCCESS') {
                    order.status = 'FAILED';
                    await order.save();
                }
            }
        }
        else if ((payload.event === 'refund.processed' || payload.event === 'refund.created') && mongoose.connection.readyState === 1) {
            const refundEntity = payload.payload?.refund?.entity;
            const paymentId = refundEntity?.payment_id;
            if (paymentId) {
                const order = await Order.findOne({ paymentId });
                if (order) {
                    // Idempotency Guard: Only process refund revocation once
                    if (order.status !== 'REFUNDED') {
                        order.status = 'REFUNDED';
                        order.refundAmount = Number(refundEntity?.amount ? refundEntity.amount / 100 : order.amount);
                        await order.save();
                        if (order.courseId) {
                            if (order.userId) {
                                // Safety: Check if student has OTHER active successful orders for this exact course
                                const otherOrders = await Order.countDocuments({
                                    userId: order.userId,
                                    courseId: order.courseId,
                                    status: 'SUCCESS',
                                    _id: { $ne: order._id }
                                });
                                // Only revoke course access if no other active paid orders grant it
                                if (otherOrders === 0) {
                                    await User.findByIdAndUpdate(order.userId, {
                                        $pull: { enrolledCourses: order.courseId }
                                    });
                                }
                            }
                            // Decrement course enrolmentCount ONLY if > 0 (prevents negative counts)
                            const courseFilter = { enrolmentCount: { $gt: 0 } };
                            if (mongoose.Types.ObjectId.isValid(order.courseId)) {
                                courseFilter._id = order.courseId;
                            }
                            else {
                                courseFilter.slug = order.courseId;
                            }
                            await Course.findOneAndUpdate(courseFilter, { $inc: { enrolmentCount: -1 } });
                        }
                    }
                }
            }
        }
        res.status(200).json({ success: true, received: true });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * Get all verified orders for Admin Dashboard & Purchases Table
 */
export const getOrdersList = async (req, res) => {
    try {
        const { status, courseId, limit = 50, page = 1 } = req.query;
        const filter = {};
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * Get authentic student enrolled orders and receipts
 */
export const getMyOrders = async (req, res) => {
    try {
        const userId = req.user?._id;
        const email = req.user?.email;
        const query = {};
        if (userId && email) {
            query.$or = [{ userId }, { studentEmail: email }];
        }
        else if (userId) {
            query.userId = userId;
        }
        else if (email) {
            query.studentEmail = email;
        }
        const orders = await Order.find(query).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: orders
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * Create a manual offline fee slip / invoice directly in MongoDB Order model
 */
export const createAdminInvoice = async (req, res) => {
    try {
        const { studentName, studentEmail, studentPhone, rollNo, courseTitle, courseId, amount, centerType, paymentChannel, paymentRef, paymentStatus, installmentNote } = req.body;
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * Update Order/Invoice status
 */
export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, refundAmount } = req.body;
        const updateData = {};
        if (status)
            updateData.status = status;
        if (refundAmount !== undefined)
            updateData.refundAmount = Number(refundAmount);
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * Delete / Void Order
 */
export const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const idStr = String(id).trim();
        const isObjectId = mongoose.Types.ObjectId.isValid(idStr) && idStr.length === 24;
        const matchConditions = [
            ...(isObjectId ? [{ _id: new mongoose.Types.ObjectId(idStr) }] : []),
            { orderId: idStr },
            { paymentId: idStr },
            { 'notes.invoiceNo': idStr },
            { 'notes.invoiceNo': new RegExp(`^${idStr}$`, 'i') },
            { orderId: new RegExp(`${idStr}$`, 'i') }
        ];
        const order = await Order.findOneAndDelete({ $or: matchConditions });
        broadcastCMSUpdated('orders', String(id));
        res.status(200).json({
            success: true,
            message: order ? 'Order deleted successfully' : 'Order record cleared'
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * Purge all demo/mock/seed payments from database
 */
export const purgeDemoOrders = async (_req, res) => {
    try {
        const result = await Order.deleteMany({
            $or: [
                { orderId: { $in: ['order_rzp_101', 'order_rzp_102', 'order_desk_103', 'order_rzp_104', 'order_rzp_105', 'order_desk_106'] } },
                { 'notes.invoiceNo': { $in: ['INV-2026-0842', 'INV-2026-0841', 'INV-2026-0840', 'INV-2026-0839', 'INV-2026-0838', 'INV-2026-0837'] } },
                { studentEmail: { $regex: /@jee2026\.in$/i } }
            ]
        });
        broadcastCMSUpdated('orders', 'all_purged');
        res.status(200).json({
            success: true,
            message: `Purged ${result.deletedCount} demo orders from database successfully.`
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
