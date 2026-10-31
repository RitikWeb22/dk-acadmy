import { apiClient } from './apiClient';

export interface CouponItem {
  id?: string;
  _id?: string;
  code: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  label: string;
  description?: string;
  usageLimit: number;
  usedCount: number;
  minCoursePrice?: number;
  maxDiscountAmount?: number;
  applicableCourses?: string[];
  isActive: boolean;
  expiryDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

const STORAGE_KEY = 'dk_academy_coupons_cache';

const DEFAULT_COUPONS: CouponItem[] = [
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

class CouponService {
  private getLocalCoupons(): CouponItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return DEFAULT_COUPONS;
  }

  private saveLocalCoupons(coupons: CouponItem[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
    } catch {
      // ignore
    }
  }

  async getAllCoupons(): Promise<CouponItem[]> {
    try {
      const res = await apiClient.get<any>('/coupons');
      if (res && res.success && Array.isArray(res.data)) {
        this.saveLocalCoupons(res.data);
        return res.data;
      }
    } catch (err) {
      console.warn('[CouponService] Falling back to local coupons cache:', err);
    }
    return this.getLocalCoupons();
  }

  async createCoupon(payload: {
    code: string;
    discountType: 'percent' | 'flat';
    discountValue: number;
    label?: string;
    description?: string;
    usageLimit: number;
    minCoursePrice?: number;
    expiryDate?: string;
    isActive?: boolean;
  }): Promise<CouponItem> {
    const formattedCode = payload.code.trim().toUpperCase();

    try {
      const res = await apiClient.post<any>('/coupons', {
        ...payload,
        code: formattedCode
      });
      if (res && res.success && res.data) {
        const current = this.getLocalCoupons();
        const updated = [res.data, ...current.filter((c) => c.code !== formattedCode)];
        this.saveLocalCoupons(updated);
        window.dispatchEvent(new CustomEvent('dk_coupons_updated'));
        return res.data;
      }
    } catch (err: any) {
      console.warn('[CouponService] Creating locally due to network fallback:', err.message);
    }

    // Local fallback
    const newCoupon: CouponItem = {
      code: formattedCode,
      discountType: payload.discountType,
      discountValue: payload.discountValue,
      label: payload.label || `${payload.discountValue}${payload.discountType === 'percent' ? '%' : '₹'} Concession`,
      description: payload.description || '',
      usageLimit: payload.usageLimit || 50,
      usedCount: 0,
      minCoursePrice: payload.minCoursePrice || 0,
      isActive: payload.isActive !== false,
      expiryDate: payload.expiryDate
    };

    const current = this.getLocalCoupons();
    const updated = [newCoupon, ...current.filter((c) => c.code !== formattedCode)];
    this.saveLocalCoupons(updated);
    window.dispatchEvent(new CustomEvent('dk_coupons_updated'));
    return newCoupon;
  }

  async updateCoupon(id: string, updates: Partial<CouponItem>): Promise<CouponItem | null> {
    try {
      const res = await apiClient.put<any>(`/coupons/${id}`, updates);
      if (res && res.success && res.data) {
        const current = this.getLocalCoupons();
        const updated = current.map((c) => (c.code === id || c._id === id || c.id === id ? res.data : c));
        this.saveLocalCoupons(updated);
        window.dispatchEvent(new CustomEvent('dk_coupons_updated'));
        return res.data;
      }
    } catch (err: any) {
      console.warn('[CouponService] Updating locally due to error:', err.message);
    }

    const current = this.getLocalCoupons();
    const index = current.findIndex((c) => c.code === id || c._id === id || c.id === id);
    if (index !== -1) {
      current[index] = { ...current[index], ...updates };
      this.saveLocalCoupons(current);
      window.dispatchEvent(new CustomEvent('dk_coupons_updated'));
      return current[index];
    }
    return null;
  }

  async deleteCoupon(id: string): Promise<boolean> {
    try {
      await apiClient.delete<any>(`/coupons/${id}`);
    } catch (err: any) {
      console.warn('[CouponService] Deleting locally:', err.message);
    }

    const current = this.getLocalCoupons().filter((c) => c.code !== id && c._id !== id && c.id !== id);
    this.saveLocalCoupons(current);
    window.dispatchEvent(new CustomEvent('dk_coupons_updated'));
    return true;
  }

  async validateAndApply(code: string, coursePrice: number, apply = false): Promise<{
    success: boolean;
    message: string;
    discountAmount?: number;
    finalPayable?: number;
    label?: string;
    usageLimit?: number;
    usedCount?: number;
    data?: any;
  }> {
    const cleanCode = code.trim().toUpperCase();

    try {
      const res = await apiClient.post<any>('/coupons/validate', {
        code: cleanCode,
        coursePrice,
        apply
      });
      if (res) {
        return {
          success: res.success !== false,
          message: res.message || 'Coupon valid',
          discountAmount: res.data?.discountAmount,
          finalPayable: res.data?.finalPayable,
          label: res.data?.label,
          usageLimit: res.data?.usageLimit,
          usedCount: res.data?.usedCount,
          data: res.data
        };
      }
    } catch (err: any) {
      // If server returned structured error (e.g. limit reached), return its message!
      if (err?.message) {
        return { success: false, message: err.message };
      }
    }

    // Local validation fallback
    const coupons = this.getLocalCoupons();
    const matched = coupons.find((c) => c.code === cleanCode);
    if (!matched) {
      return { success: false, message: 'Invalid coupon code. Try KOTA10 or EARLYBIRD.' };
    }

    if (!matched.isActive) {
      return { success: false, message: 'This coupon is currently inactive.' };
    }

    if (matched.usageLimit > 0 && matched.usedCount >= matched.usageLimit) {
      return {
        success: false,
        message: `This coupon has reached its maximum limit (${matched.usageLimit} students). No more redemptions allowed.`
      };
    }

    if (matched.minCoursePrice && coursePrice > 0 && coursePrice < matched.minCoursePrice) {
      return {
        success: false,
        message: `This coupon requires a minimum course value of ₹${matched.minCoursePrice.toLocaleString('en-IN')}.`
      };
    }

    let discount = 0;
    if (matched.discountType === 'percent') {
      discount = Math.round((coursePrice * matched.discountValue) / 100);
      if (matched.maxDiscountAmount && discount > matched.maxDiscountAmount) {
        discount = matched.maxDiscountAmount;
      }
    } else {
      discount = Math.min(matched.discountValue, coursePrice);
    }

    if (apply) {
      matched.usedCount += 1;
      this.saveLocalCoupons(coupons);
    }

    return {
      success: true,
      message: `✓ Coupon ${matched.code} applied! ${matched.label}`,
      discountAmount: discount,
      finalPayable: Math.max(0, coursePrice - discount),
      label: matched.label,
      usageLimit: matched.usageLimit,
      usedCount: matched.usedCount
    };
  }
}

export const couponService = new CouponService();
