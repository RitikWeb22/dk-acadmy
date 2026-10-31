import type { Request, Response } from 'express';
import { Coupon } from '../models/Coupon.js';

const SEED_COUPONS = [
  {
    code: 'KOTA10',
    discountType: 'percent',
    discountValue: 10,
    label: '10% OFF Kota Welcome Discount',
    description: 'Welcome discount for new admissions at DK Academy',
    usageLimit: 100,
    usedCount: 14,
    minCoursePrice: 1000,
    isActive: true
  },
  {
    code: 'EARLYBIRD',
    discountType: 'percent',
    discountValue: 15,
    label: '15% OFF Early Bird Enrollment',
    description: 'Early admission scholarship concession',
    usageLimit: 50,
    usedCount: 28,
    minCoursePrice: 2000,
    isActive: true
  },
  {
    code: 'DKSIR1000',
    discountType: 'flat',
    discountValue: 1000,
    label: '₹1,000 Flat Mentor Concession',
    description: 'Direct mentor fee concession for JEE batches',
    usageLimit: 30,
    usedCount: 9,
    minCoursePrice: 5000,
    isActive: true
  }
];

export const getAllCoupons = async (_req: Request, res: Response): Promise<void> => {
  try {
    const count = await Coupon.countDocuments();
    if (count === 0) {
      await Coupon.insertMany(SEED_COUPONS);
    }

    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: coupons.length, data: coupons });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      code,
      discountType = 'percent',
      discountValue,
      label,
      description,
      usageLimit = 50,
      minCoursePrice = 0,
      maxDiscountAmount,
      applicableCourses,
      expiryDate,
      isActive = true
    } = req.body;

    if (!code || !code.trim()) {
      res.status(400).json({ success: false, message: 'Coupon code is required' });
      return;
    }

    if (!discountValue || Number(discountValue) <= 0) {
      res.status(400).json({ success: false, message: 'Discount value must be greater than 0' });
      return;
    }

    const formattedCode = code.trim().toUpperCase();

    const existing = await Coupon.findOne({ code: formattedCode });
    if (existing) {
      res.status(400).json({ success: false, message: `Coupon with code "${formattedCode}" already exists` });
      return;
    }

    const newCoupon = await Coupon.create({
      code: formattedCode,
      discountType,
      discountValue: Number(discountValue),
      label: label?.trim() || (discountType === 'percent' ? `${discountValue}% OFF Discount` : `₹${discountValue} Flat Discount`),
      description: description?.trim() || '',
      usageLimit: Number(usageLimit) > 0 ? Number(usageLimit) : 50,
      usedCount: 0,
      minCoursePrice: Number(minCoursePrice) || 0,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
      applicableCourses: Array.isArray(applicableCourses) ? applicableCourses : [],
      isActive: Boolean(isActive),
      expiryDate: expiryDate ? new Date(expiryDate) : undefined
    });

    res.status(201).json({
      success: true,
      message: `Coupon "${formattedCode}" created with limit of ${newCoupon.usageLimit} students`,
      data: newCoupon
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const updates = { ...req.body };

    if (updates.code) {
      updates.code = updates.code.trim().toUpperCase();
    }

    const updated = await Coupon.findOneAndUpdate(
      { $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { code: id.toUpperCase() }] },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updated) {
      res.status(404).json({ success: false, message: 'Coupon not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Coupon updated successfully', data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const deleted = await Coupon.findOneAndDelete({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { code: id.toUpperCase() }]
    });

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Coupon not found' });
      return;
    }

    res.status(200).json({ success: true, message: `Coupon "${deleted.code}" deleted successfully` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const validateAndApplyCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, coursePrice = 0, apply = false } = req.body;

    if (!code) {
      res.status(400).json({ success: false, message: 'Please provide a coupon code' });
      return;
    }

    const formattedCode = String(code).trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: formattedCode });

    if (!coupon) {
      res.status(404).json({ success: false, message: 'Invalid coupon code. Please check and try again.' });
      return;
    }

    if (!coupon.isActive) {
      res.status(400).json({ success: false, message: 'This coupon is currently inactive.' });
      return;
    }

    if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
      res.status(400).json({ success: false, message: 'This coupon code has expired.' });
      return;
    }

    // Crucial check: Usage Limit
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      res.status(400).json({
        success: false,
        message: `This coupon has reached its maximum limit (${coupon.usageLimit} students). No more redemptions allowed.`
      });
      return;
    }

    const price = Number(coursePrice) || 0;
    if (coupon.minCoursePrice && price > 0 && price < coupon.minCoursePrice) {
      res.status(400).json({
        success: false,
        message: `This coupon is valid on course prices of ₹${coupon.minCoursePrice.toLocaleString('en-IN')} or above.`
      });
      return;
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percent') {
      discountAmount = Math.round((price * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = Math.min(coupon.discountValue, price);
    }

    // If apply is true (e.g. upon actual successful purchase confirmation), increment usedCount
    if (apply === true) {
      coupon.usedCount += 1;
      await coupon.save();
    }

    res.status(200).json({
      success: true,
      message: `✓ Coupon ${coupon.code} applied! ${coupon.label}`,
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        finalPayable: Math.max(0, price - discountAmount),
        label: coupon.label,
        usedCount: coupon.usedCount,
        usageLimit: coupon.usageLimit,
        remainingUses: Math.max(0, coupon.usageLimit - coupon.usedCount)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
