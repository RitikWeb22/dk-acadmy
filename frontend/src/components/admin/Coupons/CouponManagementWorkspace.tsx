import React, { useState, useEffect, useMemo } from 'react';
import {
  Tag,
  Percent,
  Plus,
  Search,
  RefreshCw,
  Copy,
  Check,
  Edit2,
  Trash2,
  Users,
  ShieldCheck,
  X,
  AlertCircle
} from 'lucide-react';
import { couponService, type CouponItem } from '../../../services/couponService';
import styles from './CouponManagementWorkspace.module.scss';

export const CouponManagementWorkspace: React.FC = () => {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'exhausted' | 'inactive'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);

  // Form State
  const [formCode, setFormCode] = useState('');
  const [formDiscountType, setFormDiscountType] = useState<'percent' | 'flat'>('percent');
  const [formDiscountValue, setFormDiscountValue] = useState<number>(10);
  const [formUsageLimit, setFormUsageLimit] = useState<number>(50);
  const [formMinCoursePrice, setFormMinCoursePrice] = useState<number>(1000);
  const [formLabel, setFormLabel] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadCoupons = async () => {
    setIsLoading(true);
    try {
      const data = await couponService.getAllCoupons();
      setCoupons(data);
    } catch (err: any) {
      showToast('Error loading coupons list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  // Copy Code Handler
  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Copied coupon code: ${code}`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Toggle Active Handler
  const handleToggleActive = async (coupon: CouponItem) => {
    const id = coupon._id || coupon.id || coupon.code;
    const nextState = !coupon.isActive;
    try {
      await couponService.updateCoupon(id, { isActive: nextState });
      setCoupons((prev) =>
        prev.map((c) =>
          (c._id === id || c.id === id || c.code === coupon.code) ? { ...c, isActive: nextState } : c
        )
      );
      showToast(`${coupon.code} is now ${nextState ? 'Active' : 'Disabled'}`);
    } catch (err: any) {
      showToast('Failed to update status');
    }
  };

  // Delete Handler
  const handleDelete = async (coupon: CouponItem) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete coupon "${coupon.code}"?`
    );
    if (!confirmDelete) return;

    const id = coupon._id || coupon.id || coupon.code;
    try {
      await couponService.deleteCoupon(id);
      setCoupons((prev) => prev.filter((c) => (c._id !== id && c.id !== id && c.code !== coupon.code)));
      showToast(`Deleted coupon: ${coupon.code}`);
    } catch (err: any) {
      showToast('Failed to delete coupon');
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setFormCode('');
    setFormDiscountType('percent');
    setFormDiscountValue(10);
    setFormUsageLimit(50);
    setFormMinCoursePrice(1000);
    setFormLabel('');
    setFormDescription('');
    setFormExpiryDate('');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (coupon: CouponItem) => {
    setEditingCoupon(coupon);
    setFormCode(coupon.code);
    setFormDiscountType(coupon.discountType);
    setFormDiscountValue(coupon.discountValue);
    setFormUsageLimit(coupon.usageLimit || 50);
    setFormMinCoursePrice(coupon.minCoursePrice || 0);
    setFormLabel(coupon.label || '');
    setFormDescription(coupon.description || '');
    setFormExpiryDate(coupon.expiryDate ? coupon.expiryDate.split('T')[0] : '');
    setFormIsActive(coupon.isActive);
    setIsModalOpen(true);
  };

  // Form Submit Handler
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = formCode.trim().toUpperCase();
    if (!cleanCode) {
      alert('Please enter a coupon code.');
      return;
    }
    if (formDiscountValue <= 0) {
      alert('Please enter a valid discount value greater than 0.');
      return;
    }
    if (formUsageLimit < 1) {
      alert('Student usage limit must be at least 1 student.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCoupon) {
        const id = editingCoupon._id || editingCoupon.id || editingCoupon.code;
        const updated = await couponService.updateCoupon(id, {
          discountType: formDiscountType,
          discountValue: formDiscountValue,
          usageLimit: formUsageLimit,
          minCoursePrice: formMinCoursePrice,
          label: formLabel || `${formDiscountValue}${formDiscountType === 'percent' ? '%' : '₹'} OFF`,
          description: formDescription,
          expiryDate: formExpiryDate || undefined,
          isActive: formIsActive
        });
        if (updated) {
          setCoupons((prev) =>
            prev.map((c) =>
              (c._id === id || c.id === id || c.code === editingCoupon.code) ? updated : c
            )
          );
        }
        showToast(`Coupon "${cleanCode}" updated successfully!`);
      } else {
        const created = await couponService.createCoupon({
          code: cleanCode,
          discountType: formDiscountType,
          discountValue: formDiscountValue,
          usageLimit: formUsageLimit,
          minCoursePrice: formMinCoursePrice,
          label: formLabel || `${formDiscountValue}${formDiscountType === 'percent' ? '%' : '₹'} OFF Discount`,
          description: formDescription,
          expiryDate: formExpiryDate || undefined
        });
        setCoupons((prev) => [created, ...prev]);
        showToast(`Created new coupon "${cleanCode}" with limit of ${formUsageLimit} students!`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error saving coupon');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered coupons
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.code.toLowerCase().includes(q) ||
        (c.label && c.label.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      const isExhausted = c.usageLimit > 0 && c.usedCount >= c.usageLimit;

      if (statusFilter === 'active') return c.isActive && !isExhausted;
      if (statusFilter === 'exhausted') return isExhausted;
      if (statusFilter === 'inactive') return !c.isActive;
      return true;
    });
  }, [coupons, searchQuery, statusFilter]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalCoupons = coupons.length;
    const activeCoupons = coupons.filter((c) => c.isActive && (c.usageLimit === 0 || c.usedCount < c.usageLimit)).length;
    const totalRedeemed = coupons.reduce((acc, c) => acc + (c.usedCount || 0), 0);
    const totalAvailableSlots = coupons.reduce(
      (acc, c) => acc + Math.max(0, (c.usageLimit || 0) - (c.usedCount || 0)),
      0
    );
    return { totalCoupons, activeCoupons, totalRedeemed, totalAvailableSlots };
  }, [coupons]);

  return (
    <div className={styles.couponsWorkspaceShell}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className={styles.toastBanner}>
          <Check size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Page Header & Actions */}
      <div className={styles.pageHeaderBar}>
        <div className={styles.breadcrumbTitleCol}>
          <div className={styles.breadcrumbNav}>
            <span>DK ACADEMY</span>
            <span>/</span>
            <span>ADMIN</span>
            <span>/</span>
            <span>COUPONS &amp; SCHOLARSHIPS</span>
          </div>
          <h1 className={styles.pageMainHeading}>Discount Coupons &amp; Student Quota Limits</h1>
          <p className={styles.pageSubtitle}>
            Create promo codes, define discount percentages or flat concessions, and set strict student usage limits
            (e.g., maximum 50 students). Once the quota is full, redemptions are locked automatically.
          </p>
        </div>

        <div className={styles.headerActionsGroup}>
          <button
            type="button"
            className={styles.syncBtn}
            onClick={loadCoupons}
            disabled={isLoading}
            title="Reload coupons from database"
          >
            <RefreshCw size={14} className={isLoading ? styles.spinIcon : ''} />
            <span>{isLoading ? 'Syncing...' : 'Sync Live'}</span>
          </button>

          <button
            type="button"
            className={styles.createCouponBtn}
            onClick={handleOpenCreate}
            title="Create a new discount coupon with student limit"
          >
            <Plus size={16} />
            <span>+ Create Discount Coupon</span>
          </button>
        </div>
      </div>

      {/* 2. Bento Stats KPI Grid */}
      <div className={styles.bentoStatsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIconTile} ${styles.blueTile}`}>
            <Tag size={20} />
          </div>
          <div className={styles.statMeta}>
            <span className={styles.statValue}>{stats.activeCoupons}</span>
            <span className={styles.statLabel}>Active Promo Codes</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIconTile} ${styles.emeraldTile}`}>
            <Users size={20} />
          </div>
          <div className={styles.statMeta}>
            <span className={styles.statValue}>{stats.totalRedeemed}</span>
            <span className={styles.statLabel}>Students Applied</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIconTile} ${styles.amberTile}`}>
            <ShieldCheck size={20} />
          </div>
          <div className={styles.statMeta}>
            <span className={styles.statValue}>{stats.totalAvailableSlots}</span>
            <span className={styles.statLabel}>Remaining Quota Slots</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIconTile} ${styles.purpleTile}`}>
            <Percent size={20} />
          </div>
          <div className={styles.statMeta}>
            <span className={styles.statValue}>{stats.totalCoupons}</span>
            <span className={styles.statLabel}>Total Campaigns</span>
          </div>
        </div>
      </div>

      {/* 3. Search and Filter Bar */}
      <div className={styles.filterActionBar}>
        <div className={styles.searchBoxWrapper}>
          <Search size={15} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search coupon code or campaign..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.filterControlsRight}>
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All Statuses ({coupons.length})</option>
            <option value="active">Active &amp; Open</option>
            <option value="exhausted">Limit Reached (Full)</option>
            <option value="inactive">Disabled</option>
          </select>
        </div>
      </div>

      {/* 4. Coupons Data Table */}
      <div className={styles.tableContainerCard}>
        {filteredCoupons.length === 0 ? (
          <div className={styles.emptyStateBox}>
            <AlertCircle size={36} color="#94a3b8" />
            <h3>No discount coupons found</h3>
            <p>
              {searchQuery
                ? `No coupon matches "${searchQuery}". Try a different query.`
                : 'Click "+ Create Discount Coupon" above to set up your first student discount promo code.'}
            </p>
          </div>
        ) : (
          <table className={styles.couponsTable}>
            <thead>
              <tr>
                <th>Coupon Code &amp; Campaign</th>
                <th>Discount Value</th>
                <th>Student Quota &amp; Progress</th>
                <th>Min Course Fee</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoupons.map((coupon) => {
                const used = coupon.usedCount || 0;
                const limit = coupon.usageLimit || 50;
                const remaining = Math.max(0, limit - used);
                const percentUsed = Math.min(100, Math.round((used / limit) * 100));
                const isExhausted = limit > 0 && used >= limit;

                let progressColorClass = styles.fillGreen;
                let remainingBadgeClass = styles.plentyQuota;
                if (isExhausted) {
                  progressColorClass = styles.fillRed;
                  remainingBadgeClass = styles.exhaustedQuota;
                } else if (percentUsed >= 70) {
                  progressColorClass = styles.fillAmber;
                  remainingBadgeClass = styles.lowQuota;
                }

                return (
                  <tr key={coupon._id || coupon.id || coupon.code}>
                    {/* Code & Campaign */}
                    <td>
                      <div>
                        <div className={styles.codePillGroup}>
                          <span>{coupon.code}</span>
                          <button
                            type="button"
                            className={styles.copyCodeBtn}
                            onClick={() => handleCopy(coupon.code)}
                            title="Copy code"
                          >
                            {copiedCode === coupon.code ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                          </button>
                        </div>
                        <div className={styles.couponLabelTitle}>{coupon.label}</div>
                        {coupon.description && (
                          <div className={styles.couponDescriptionText}>{coupon.description}</div>
                        )}
                      </div>
                    </td>

                    {/* Discount Value */}
                    <td>
                      <span
                        className={`${styles.discountPill} ${
                          coupon.discountType === 'percent' ? styles.percentDiscount : styles.flatDiscount
                        }`}
                      >
                        {coupon.discountType === 'percent'
                          ? `${coupon.discountValue}% OFF`
                          : `₹${coupon.discountValue.toLocaleString('en-IN')} FLAT`}
                      </span>
                    </td>

                    {/* Usage Quota & Progress Bar */}
                    <td>
                      <div className={styles.usageQuotaCell}>
                        <div className={styles.usageTextRow}>
                          <span className={styles.usageCountFraction}>
                            <strong>{used}</strong> / {limit} students
                          </span>
                          <span className={`${styles.usageRemainingPill} ${remainingBadgeClass}`}>
                            {isExhausted ? 'Quota Full' : `${remaining} left`}
                          </span>
                        </div>
                        <div className={styles.progressBarTrack}>
                          <div
                            className={`${styles.progressBarFill} ${progressColorClass}`}
                            style={{ width: `${percentUsed}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Min Course Fee */}
                    <td>
                      {coupon.minCoursePrice && coupon.minCoursePrice > 0 ? (
                        <span>₹{coupon.minCoursePrice.toLocaleString('en-IN')}</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>None</span>
                      )}
                    </td>

                    {/* Active / Inactive Toggle Switch */}
                    <td>
                      <label className={styles.switchToggle} title={coupon.isActive ? 'Deactivate' : 'Activate'}>
                        <input
                          type="checkbox"
                          checked={coupon.isActive}
                          onChange={() => handleToggleActive(coupon)}
                        />
                        <span className={styles.switchSlider} />
                      </label>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className={styles.actionBtnsRow}>
                        <button
                          type="button"
                          className={styles.actionIconBtn}
                          onClick={() => handleOpenEdit(coupon)}
                          title="Edit coupon details and limit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.actionIconBtn} ${styles.deleteAction}`}
                          onClick={() => handleDelete(coupon)}
                          title="Delete coupon"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 5. Create / Edit Coupon Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => !isSubmitting && setIsModalOpen(false)}>
          <div className={styles.modalContentCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2>{editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Discount Coupon'}</h2>
                <p>Configure concession value and maximum student redemption limit.</p>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm}>
              <div className={styles.modalFormBody}>
                {/* Coupon Code */}
                <div className={styles.formFieldGroup}>
                  <label>Coupon Code (Auto-Uppercase) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. JEE50, KOTA10, SCHOLAR2026"
                    value={formCode}
                    disabled={!!editingCoupon}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  />
                  <span className={styles.fieldHelperText}>
                    Students will enter this exact code during checkout.
                  </span>
                </div>

                {/* Discount Type & Value */}
                <div className={styles.formRowTwoCol}>
                  <div className={styles.formFieldGroup}>
                    <label>Discount Type</label>
                    <select
                      value={formDiscountType}
                      onChange={(e) => setFormDiscountType(e.target.value as any)}
                    >
                      <option value="percent">Percentage (% OFF)</option>
                      <option value="flat">Flat Amount (₹ OFF)</option>
                    </select>
                  </div>

                  <div className={styles.formFieldGroup}>
                    <label>Discount Value *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={formDiscountType === 'percent' ? 100 : 100000}
                      value={formDiscountValue}
                      onChange={(e) => setFormDiscountValue(Number(e.target.value))}
                    />
                    <span className={styles.fieldHelperText}>
                      {formDiscountType === 'percent' ? 'e.g. 15 for 15% discount' : 'e.g. 1000 for ₹1,000 flat'}
                    </span>
                  </div>
                </div>

                {/* Student Usage Limit (The Key Feature requested by user) */}
                <div className={`${styles.formFieldGroup} ${styles.highlightLimitField}`}>
                  <label>Student Redemption Limit (Max Number of Students) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formUsageLimit}
                    onChange={(e) => setFormUsageLimit(Number(e.target.value))}
                  />
                  <span className={styles.fieldHelperText}>
                    Only this many students can successfully apply this coupon. Once reached (e.g. 50/50), subsequent
                    students will see "This coupon code has reached its maximum limit."
                  </span>
                </div>

                {/* Min Course Price & Expiry */}
                <div className={styles.formRowTwoCol}>
                  <div className={styles.formFieldGroup}>
                    <label>Minimum Course Price (₹)</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="e.g. 1000"
                      value={formMinCoursePrice}
                      onChange={(e) => setFormMinCoursePrice(Number(e.target.value))}
                    />
                  </div>

                  <div className={styles.formFieldGroup}>
                    <label>Expiry Date (Optional)</label>
                    <input
                      type="date"
                      value={formExpiryDate}
                      onChange={(e) => setFormExpiryDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Campaign Label & Description */}
                <div className={styles.formFieldGroup}>
                  <label>Campaign Title / Label</label>
                  <input
                    type="text"
                    placeholder="e.g. 15% OFF Early Bird Kota Admission"
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value)}
                  />
                </div>

                <div className={styles.formFieldGroup}>
                  <label>Description / Terms</label>
                  <input
                    type="text"
                    placeholder="e.g. Applicable on all JEE 2026 1-year and 2-year batches"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelModalBtn}
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitModalBtn} disabled={isSubmitting}>
                  {isSubmitting
                    ? 'Saving...'
                    : editingCoupon
                    ? 'Update Coupon'
                    : `Create Coupon (${formUsageLimit} Students Max)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
