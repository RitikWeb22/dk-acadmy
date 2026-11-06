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
  AlertCircle,
  FileSpreadsheet,
  Printer,
  Megaphone,
  Sparkles,
  Zap,
  ArrowRight,
  ExternalLink,
  Eye,
  CheckCircle2,
  Lock,
  Layers,
  ShoppingBag
} from 'lucide-react';
import { couponService, type CouponItem } from '../../../services/couponService';
import {
  offerService,
  type BannerOfferData,
  type PopupOfferData,
  type ItemOfferData,
  OFFERS_EVENT_KEY
} from '../../../services/offerService';
import { TRIGGER_PREVIEW_POPUP_EVENT } from '../../common/PromotionalPopupModal/PromotionalPopupModal';
import { exportToExcel, exportToPDF } from '../../../utils/exportUtils';
import { AdminConfirmModal } from '../Common/AdminConfirmModal';
import styles from './CouponManagementWorkspace.module.scss';

type WorkspaceTab = 'coupons' | 'banner_offers' | 'popup_offers' | 'item_offers';

export const CouponManagementWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('coupons');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ─────────────────────────────────────────────────────────────
  // 1. COUPONS STATE & LOGIC
  // ─────────────────────────────────────────────────────────────
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'single' | 'bulk';
    coupon?: CouponItem;
  }>({ isOpen: false, type: 'single' });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'exhausted' | 'inactive'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [formCode, setFormCode] = useState('');
  const [formDiscountType, setFormDiscountType] = useState<'percent' | 'flat'>('percent');
  const [formDiscountValue, setFormDiscountValue] = useState<number>(10);
  const [formUsageLimit, setFormUsageLimit] = useState<number>(50);
  const [formMinCoursePrice, setFormMinCoursePrice] = useState<number>(1000);
  const [formLabel, setFormLabel] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [isSubmittingCoupon, setIsSubmittingCoupon] = useState(false);

  const loadCoupons = async () => {
    setIsLoadingCoupons(true);
    try {
      const data = await couponService.getAllCoupons();
      setCoupons(data);
    } catch {
      showToast('Error loading coupons list');
    } finally {
      setIsLoadingCoupons(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 2. OFFERS STATE (BANNER, POPUP, ITEM DISCOUNT)
  // ─────────────────────────────────────────────────────────────
  const [bannerForm, setBannerForm] = useState<BannerOfferData>({
    offerType: 'banner',
    title: 'Top Announcement Banner',
    tagText: 'SPECIAL ADMISSION ALERT',
    message: 'JEE Main & Advanced 2026-27 Batches Open! Avail up to 90% Merit Scholarship + Kota Study Material.',
    linkText: 'Explore Batches',
    linkUrl: '/courses',
    isActive: true
  });

  const [popupForm, setPopupForm] = useState<PopupOfferData>({
    offerType: 'popup',
    title: 'Kota Flagship Batch - Limited Admission Offer!',
    tagText: 'EXCLUSIVE SCHOLARSHIP',
    message: 'Get direct mentorship under Dharmendra Kumar (DK Sir) with 20-30s math inspection shortcuts, Kota DPPs & CBT test series.',
    imageUrl: '/img/dk-results-banner.jpeg',
    buttonText: 'Claim Scholarship & Enroll Now',
    linkUrl: '/courses',
    audience: 'all',
    frequency: 'once_per_session',
    isActive: true
  });

  const [itemOfferForm, setItemOfferForm] = useState<ItemOfferData>({
    offerType: 'item_discount',
    title: 'IIT-JEE Merit Flash Sale',
    badgeText: '🔥 SPECIAL 25% OFF',
    discountType: 'percent',
    discountValue: 25,
    targetScope: 'all',
    applicableItemIds: [],
    message: 'Instant 25% discount applied across all premium flagship courses and CBT mock series.',
    isActive: true
  });

  const [isSavingOffer, setIsSavingOffer] = useState(false);

  const loadOffers = async () => {
    try {
      const res = await offerService.getAllOffers();
      if (res.bannerOffer) {
        setBannerForm(res.bannerOffer);
      }
      if (res.popupOffer) {
        setPopupForm(res.popupOffer);
      }
      if (res.itemOffers && res.itemOffers.length > 0) {
        setItemOfferForm(res.itemOffers[0]);
      }
    } catch {
      console.warn('Failed loading offers');
    }
  };

  useEffect(() => {
    loadCoupons();
    loadOffers();

    const handleOfferEvents = () => {
      loadOffers();
    };

    window.addEventListener(OFFERS_EVENT_KEY, handleOfferEvents);
    return () => window.removeEventListener(OFFERS_EVENT_KEY, handleOfferEvents);
  }, []);

  // ─────────────────────────────────────────────────────────────
  // HANDLERS FOR OFFERS
  // ─────────────────────────────────────────────────────────────
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingOffer(true);
    try {
      await offerService.saveOffer(bannerForm);
      showToast('✓ Top page banner offer updated successfully!');
    } catch {
      showToast('Failed to save banner offer');
    } finally {
      setIsSavingOffer(false);
    }
  };

  const handleSavePopup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingOffer(true);
    try {
      await offerService.saveOffer(popupForm);
      showToast('✓ Visitor promotional popup updated successfully!');
    } catch {
      showToast('Failed to save popup offer');
    } finally {
      setIsSavingOffer(false);
    }
  };

  const handleSaveItemOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingOffer(true);
    try {
      await offerService.saveOffer(itemOfferForm);
      showToast(
        itemOfferForm.isActive
          ? `✓ "${itemOfferForm.badgeText}" applied across ${itemOfferForm.targetScope === 'all' ? 'all courses & test series' : itemOfferForm.targetScope}!`
          : '✓ Flash sale offer deactivated.'
      );
    } catch {
      showToast('Failed to save flash sale offer');
    } finally {
      setIsSavingOffer(false);
    }
  };

  const handleTriggerTestPopup = () => {
    window.dispatchEvent(new CustomEvent(TRIGGER_PREVIEW_POPUP_EVENT, { detail: popupForm }));
    showToast('Launched live preview popup on screen');
  };

  // ─────────────────────────────────────────────────────────────
  // HANDLERS FOR COUPONS
  // ─────────────────────────────────────────────────────────────
  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Copied coupon code: ${code}`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleCouponActive = async (coupon: CouponItem) => {
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
    } catch {
      showToast('Failed to update status');
    }
  };

  const handleDeleteCoupon = (coupon: CouponItem) => {
    setConfirmModal({ isOpen: true, type: 'single', coupon });
  };

  const handleRequestBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setConfirmModal({ isOpen: true, type: 'bulk' });
  };

  const handleConfirmAction = async () => {
    if (confirmModal.type === 'single' && confirmModal.coupon) {
      const coupon = confirmModal.coupon;
      const id = coupon._id || coupon.id || coupon.code;
      try {
        await couponService.deleteCoupon(id);
        setCoupons((prev) => prev.filter((c) => c._id !== id && c.id !== id && c.code !== coupon.code));
        setSelectedIds((prev) => prev.filter((i) => i !== id));
        showToast(`Deleted coupon: ${coupon.code}`);
      } catch {
        showToast('Failed to delete coupon');
      }
      setConfirmModal({ isOpen: false, type: 'single' });
    } else if (confirmModal.type === 'bulk') {
      const idsToDelete = [...selectedIds];
      for (const id of idsToDelete) {
        try {
          await couponService.deleteCoupon(id);
        } catch {}
      }
      setCoupons((prev) => prev.filter((c) => !idsToDelete.includes(c._id || c.id || c.code)));
      setSelectedIds([]);
      showToast(`✓ Deleted ${idsToDelete.length} coupon(s) successfully!`);
      setConfirmModal({ isOpen: false, type: 'single' });
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredCoupons.map((c) => c._id || c.id || c.code));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleOpenCreateModal = () => {
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
    setFormError(null);
    setIsCouponModalOpen(true);
  };

  const handleOpenEditModal = (coupon: CouponItem) => {
    setEditingCoupon(coupon);
    setFormCode(coupon.code);
    setFormDiscountType(coupon.discountType || 'percent');
    setFormDiscountValue(coupon.discountValue || 10);
    setFormUsageLimit(coupon.usageLimit || 50);
    setFormMinCoursePrice(coupon.minCoursePrice || 0);
    setFormLabel(coupon.label || '');
    setFormDescription(coupon.description || '');
    setFormExpiryDate(coupon.expiryDate ? coupon.expiryDate.split('T')[0] : '');
    setFormIsActive(coupon.isActive);
    setFormError(null);
    setIsCouponModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanCode = formCode.trim().toUpperCase();
    if (!cleanCode) {
      setFormError('Coupon code is required');
      return;
    }

    if (!formDiscountValue || formDiscountValue <= 0) {
      setFormError('Discount value must be greater than 0');
      return;
    }

    if (formDiscountType === 'percent' && formDiscountValue > 100) {
      setFormError('Percentage discount cannot exceed 100%');
      return;
    }

    setIsSubmittingCoupon(true);
    try {
      const generatedLabel = formLabel.trim() ||
        (formDiscountType === 'percent' ? `${formDiscountValue}% OFF Discount` : `₹${formDiscountValue} Flat Discount`);

      if (editingCoupon) {
        const id = editingCoupon._id || editingCoupon.id || editingCoupon.code;
        const updated = await couponService.updateCoupon(id, {
          discountType: formDiscountType,
          discountValue: formDiscountValue,
          usageLimit: formUsageLimit,
          minCoursePrice: formMinCoursePrice,
          label: generatedLabel,
          description: formDescription.trim(),
          expiryDate: formExpiryDate ? new Date(formExpiryDate).toISOString() : undefined,
          isActive: formIsActive
        });
        if (updated) {
          setCoupons((prev) =>
            prev.map((c) => (c._id === id || c.id === id || c.code === editingCoupon.code) ? updated : c)
          );
          showToast(`Updated coupon ${cleanCode}`);
        }
      } else {
        const created = await couponService.createCoupon({
          code: cleanCode,
          discountType: formDiscountType,
          discountValue: formDiscountValue,
          usageLimit: formUsageLimit,
          minCoursePrice: formMinCoursePrice,
          label: generatedLabel,
          description: formDescription.trim(),
          expiryDate: formExpiryDate ? new Date(formExpiryDate).toISOString() : undefined,
          isActive: formIsActive
        });
        setCoupons((prev) => [created, ...prev]);
        showToast(`Created new coupon "${cleanCode}" for ${formUsageLimit} students!`);
      }
      setIsCouponModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Error saving coupon');
    } finally {
      setIsSubmittingCoupon(false);
    }
  };

  // Filtered coupons
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const matchesSearch =
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      const isExhausted = c.usageLimit > 0 && c.usedCount >= c.usageLimit;
      if (statusFilter === 'active') return c.isActive && !isExhausted;
      if (statusFilter === 'exhausted') return isExhausted;
      if (statusFilter === 'inactive') return !c.isActive;

      return true;
    });
  }, [coupons, searchQuery, statusFilter]);

  // Overall Stats
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

  // Mock calculation for live card preview in Tab 4
  const mockCoursePrice = 18500;
  const mockDiscountAmount =
    itemOfferForm.discountType === 'percent'
      ? Math.round((mockCoursePrice * Math.min(100, itemOfferForm.discountValue)) / 100)
      : Math.min(mockCoursePrice, itemOfferForm.discountValue);
  const mockDiscountedCoursePrice = Math.max(0, mockCoursePrice - mockDiscountAmount);

  const mockTestPrice = 299;
  const mockTestDiscount =
    itemOfferForm.discountType === 'percent'
      ? Math.round((mockTestPrice * Math.min(100, itemOfferForm.discountValue)) / 100)
      : Math.min(mockTestPrice, itemOfferForm.discountValue);
  const mockDiscountedTestPrice = Math.max(0, mockTestPrice - mockTestDiscount);

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
            <span>DISCOUNTS AND OFFERS</span>
          </div>
          <h1 className={styles.pageMainHeading}>Discounts and Offers</h1>
          <p className={styles.pageSubtitle}>
            Manage promotional discount coupons, site-wide announcement banners, visitor popups, and 1-click sales discounts with custom badges.
          </p>
        </div>

        <div className={styles.headerActionsGroup}>
          <button
            type="button"
            className={styles.syncBtn}
            onClick={() => {
              loadCoupons();
              loadOffers();
              showToast('Refreshed coupons and offers from database');
            }}
            title="Reload coupons and offers from database"
          >
            <RefreshCw size={14} className={isLoadingCoupons ? styles.spinning : ''} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* 2. Workspace Navigation Tabs */}
      <div className={styles.workspaceTabsBar} role="tablist" aria-label="Discounts and Offers Sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'coupons'}
          className={`${styles.workspaceTabBtn} ${activeTab === 'coupons' ? styles.workspaceTabBtnActive : ''}`}
          onClick={() => setActiveTab('coupons')}
        >
          <Tag size={16} />
          <span>Promo Coupons</span>
          <span className={styles.tabBadgeLive}>{stats.totalCoupons}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'banner_offers'}
          className={`${styles.workspaceTabBtn} ${activeTab === 'banner_offers' ? styles.workspaceTabBtnActive : ''}`}
          onClick={() => setActiveTab('banner_offers')}
        >
          <Megaphone size={16} />
          <span>Top Page Banner Offer</span>
          <span className={bannerForm.isActive ? styles.tabBadgeLive : styles.tabBadgeOff}>
            {bannerForm.isActive ? 'Live' : 'Hidden'}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'popup_offers'}
          className={`${styles.workspaceTabBtn} ${activeTab === 'popup_offers' ? styles.workspaceTabBtnActive : ''}`}
          onClick={() => setActiveTab('popup_offers')}
        >
          <Sparkles size={16} />
          <span>Visitor Popup Banner</span>
          <span className={popupForm.isActive ? styles.tabBadgeLive : styles.tabBadgeOff}>
            {popupForm.isActive ? 'Live' : 'Hidden'}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'item_offers'}
          className={`${styles.workspaceTabBtn} ${activeTab === 'item_offers' ? styles.workspaceTabBtnActive : ''}`}
          onClick={() => setActiveTab('item_offers')}
        >
          <Zap size={16} />
          <span>Courses & Test Item Sales</span>
          <span className={itemOfferForm.isActive ? styles.tabBadgeLive : styles.tabBadgeOff}>
            {itemOfferForm.isActive ? 'Sale Active' : 'Off'}
          </span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: PROMO COUPONS
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'coupons' && (
        <>
          {/* Summary Metric Cards */}
          <div className={styles.metricGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <span className={styles.metricLabel}>Total Coupons</span>
                <Tag size={16} className={styles.metricIconBlue} />
              </div>
              <div className={styles.metricValue}>{stats.totalCoupons}</div>
              <div className={styles.metricSubtext}>{stats.activeCoupons} currently live for students</div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <span className={styles.metricLabel}>Total Redemptions</span>
                <Users size={16} className={styles.metricIconGreen} />
              </div>
              <div className={styles.metricValue}>{stats.totalRedeemed}</div>
              <div className={styles.metricSubtext}>Times promo codes were redeemed</div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <span className={styles.metricLabel}>Available Student Slots</span>
                <ShieldCheck size={16} className={styles.metricIconPurple} />
              </div>
              <div className={styles.metricValue}>{stats.totalAvailableSlots}</div>
              <div className={styles.metricSubtext}>Remaining slots before codes exhaust</div>
            </div>
          </div>

          {/* Action Row & Filters */}
          <div className={styles.controlsRow}>
            <div className={styles.searchBox}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search coupon code or discount label..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search coupons"
              />
              {searchQuery && (
                <button
                  type="button"
                  className={styles.clearSearchBtn}
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className={styles.filterGroup}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                aria-label="Filter coupons by status"
                className={styles.statusSelect}
              >
                <option value="all">All Statuses ({coupons.length})</option>
                <option value="active">Active & Available</option>
                <option value="exhausted">Usage Limit Reached</option>
                <option value="inactive">Disabled / Paused</option>
              </select>

              <button
                type="button"
                className={styles.createCouponBtn}
                onClick={handleOpenCreateModal}
              >
                <Plus size={16} />
                <span>Create Coupon</span>
              </button>
            </div>
          </div>

          {/* Coupons Table */}
          <div className={styles.tableCard}>
            {filteredCoupons.length === 0 ? (
              <div className={styles.emptyState}>
                <Tag size={40} className={styles.emptyIcon} />
                <h3>No discount coupons found</h3>
                <p>Create a promo code to offer concessions to enrolling aspirants.</p>
                <button
                  type="button"
                  className={styles.emptyCreateBtn}
                  onClick={handleOpenCreateModal}
                >
                  <Plus size={15} />
                  <span>Create First Coupon</span>
                </button>
              </div>
            ) : (
              <table className={styles.couponsTable}>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.length > 0 && selectedIds.length === filteredCoupons.length}
                        onChange={handleSelectAll}
                        aria-label="Select all coupons"
                      />
                    </th>
                    <th>Code</th>
                    <th>Discount</th>
                    <th>Student Limit</th>
                    <th>Redeemed</th>
                    <th>Min. Fee</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCoupons.map((coupon) => {
                    const id = coupon._id || coupon.id || coupon.code;
                    const isExhausted = coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit;
                    const percentUsed = coupon.usageLimit > 0 ? Math.min(100, Math.round((coupon.usedCount / coupon.usageLimit) * 100)) : 0;
                    const isSelected = selectedIds.includes(id);

                    return (
                      <tr key={id} className={isSelected ? styles.rowSelected : ''}>
                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectOne(id)}
                            aria-label={`Select coupon ${coupon.code}`}
                          />
                        </td>
                        <td>
                          <div className={styles.codeWrap}>
                            <span className={styles.couponCodeText}>{coupon.code}</span>
                            <button
                              type="button"
                              className={styles.copyBtn}
                              onClick={() => handleCopy(coupon.code)}
                              title="Copy code to clipboard"
                            >
                              {copiedCode === coupon.code ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                            </button>
                          </div>
                          <div className={styles.couponSubLabel}>{coupon.label}</div>
                        </td>
                        <td>
                          <span className={styles.discountPill}>
                            {coupon.discountType === 'percent' ? (
                              <>
                                <Percent size={12} />
                                <span>{coupon.discountValue}% OFF</span>
                              </>
                            ) : (
                              <span>₹{coupon.discountValue.toLocaleString('en-IN')} FLAT</span>
                            )}
                          </span>
                        </td>
                        <td>
                          <span className={styles.limitText}>
                            {coupon.usageLimit > 0 ? `${coupon.usageLimit} Students` : 'Unlimited'}
                          </span>
                        </td>
                        <td>
                          <div className={styles.usageProgressWrap}>
                            <div className={styles.usageNums}>
                              <strong>{coupon.usedCount || 0}</strong>
                              <span>/ {coupon.usageLimit || '∞'}</span>
                            </div>
                            {coupon.usageLimit > 0 && (
                              <div className={styles.progressBarBg}>
                                <div
                                  className={styles.progressBarFill}
                                  style={{
                                    width: `${percentUsed}%`,
                                    background: isExhausted ? '#ef4444' : percentUsed > 75 ? '#f59e0b' : '#10b981'
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={styles.minPriceText}>
                            {coupon.minCoursePrice && coupon.minCoursePrice > 0 ? `₹${coupon.minCoursePrice.toLocaleString('en-IN')}` : 'Any'}
                          </span>
                        </td>
                        <td>
                          {isExhausted ? (
                            <span className={`${styles.statusBadge} ${styles.statusExhausted}`}>Exhausted</span>
                          ) : coupon.isActive ? (
                            <span className={`${styles.statusBadge} ${styles.statusActive}`}>Active</span>
                          ) : (
                            <span className={`${styles.statusBadge} ${styles.statusInactive}`}>Disabled</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className={styles.rowActions}>
                            <button
                              type="button"
                              className={styles.actionIconBtn}
                              onClick={() => handleToggleCouponActive(coupon)}
                              title={coupon.isActive ? 'Disable this coupon' : 'Activate this coupon'}
                            >
                              <ShieldCheck size={15} color={coupon.isActive ? '#10b981' : '#94a3b8'} />
                            </button>
                            <button
                              type="button"
                              className={styles.actionIconBtn}
                              onClick={() => handleOpenEditModal(coupon)}
                              title="Edit coupon parameters"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              type="button"
                              className={`${styles.actionIconBtn} ${styles.deleteIconBtn}`}
                              onClick={() => handleDeleteCoupon(coupon)}
                              title="Delete coupon"
                            >
                              <Trash2 size={15} />
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
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: TOP PAGE BANNER OFFER
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'banner_offers' && (
        <div className={styles.offerWorkspaceCard}>
          <div className={styles.offerCardHeader}>
            <div className={styles.offerTitleRow}>
              <h2>Top Announcement Banner (Har Page Ke Banner Pr)</h2>
              <p>This banner is permanently pinned at the top header of every single public page across the website.</p>
            </div>

            <div
              className={styles.switchWrap}
              onClick={() => setBannerForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
            >
              <span className={`${styles.switchIndicator} ${bannerForm.isActive ? styles.switchActive : ''}`} />
              <span>{bannerForm.isActive ? 'BANNER LIVE ON ALL PAGES' : 'BANNER DISABLED / HIDDEN'}</span>
            </div>
          </div>

          <form onSubmit={handleSaveBanner} className={styles.offerGrid}>
            {/* Form Column */}
            <div className={styles.formColumn}>
              <div>
                <label className={styles.fieldLabel}>Tag Text (Badge Pill)</label>
                <input
                  type="text"
                  className={styles.textInput}
                  value={bannerForm.tagText}
                  onChange={(e) => setBannerForm({ ...bannerForm, tagText: e.target.value })}
                  placeholder="e.g. SPECIAL ADMISSION ALERT, DIWALI SPECIAL"
                  required
                />
              </div>

              <div>
                <label className={styles.fieldLabel}>Announcement Message</label>
                <textarea
                  className={styles.textareaInput}
                  value={bannerForm.message}
                  onChange={(e) => setBannerForm({ ...bannerForm, message: e.target.value })}
                  placeholder="Enter the message displayed to users on every page..."
                  rows={3}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className={styles.fieldLabel}>Action Button Text</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={bannerForm.linkText}
                    onChange={(e) => setBannerForm({ ...bannerForm, linkText: e.target.value })}
                    placeholder="e.g. Explore Batches"
                  />
                </div>

                <div>
                  <label className={styles.fieldLabel}>Target Link URL</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={bannerForm.linkUrl}
                    onChange={(e) => setBannerForm({ ...bannerForm, linkUrl: e.target.value })}
                    placeholder="/courses or /test-series"
                  />
                </div>
              </div>

              <button type="submit" className={styles.saveOfferBtn} disabled={isSavingOffer}>
                <Check size={16} />
                <span>{isSavingOffer ? 'Saving Banner...' : 'Save & Update Top Banner'}</span>
              </button>
            </div>

            {/* Live Preview Column */}
            <div className={styles.previewColumn}>
              <div className={styles.previewHeading}>
                <span>Live Website Header Preview</span>
                <span style={{ fontSize: '11px', color: bannerForm.isActive ? '#10b981' : '#94a3b8' }}>
                  {bannerForm.isActive ? '● Active' : '○ Disabled'}
                </span>
              </div>

              <div
                style={{
                  background: 'linear-gradient(90deg, #1e1b4b 0%, #312e81 40%, #1e3a8a 100%)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <span
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '9999px',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Sparkles size={10} />
                    <span>{bannerForm.tagText || 'OFFER'}</span>
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {bannerForm.message || 'Announcement message preview'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span
                    style={{
                      background: '#ffffff',
                      color: '#1e1b4b',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '5px'
                    }}
                  >
                    {bannerForm.linkText || 'Claim Offer'}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                This bar is automatically rendered sticky at the very top of the desktop & mobile navigation header on all pages.
              </p>
            </div>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: VISITOR POPUP BANNER OFFER
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'popup_offers' && (
        <div className={styles.offerWorkspaceCard}>
          <div className={styles.offerCardHeader}>
            <div className={styles.offerTitleRow}>
              <h2>Visitor Promotional Popup (Image & Link Modal)</h2>
              <p>Promotional modal popup that automatically appears when users visit the website.</p>
            </div>

            <div
              className={styles.switchWrap}
              onClick={() => setPopupForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
            >
              <span className={`${styles.switchIndicator} ${popupForm.isActive ? styles.switchActive : ''}`} />
              <span>{popupForm.isActive ? 'POPUP ACTIVE ON VISIT' : 'POPUP PAUSED'}</span>
            </div>
          </div>

          <form onSubmit={handleSavePopup} className={styles.offerGrid}>
            {/* Form Column */}
            <div className={styles.formColumn}>
              <div>
                <label className={styles.fieldLabel}>Offer Heading</label>
                <input
                  type="text"
                  className={styles.textInput}
                  value={popupForm.title}
                  onChange={(e) => setPopupForm({ ...popupForm, title: e.target.value })}
                  placeholder="e.g. Special Admission Scholarship - Flat 30% Off"
                  required
                />
              </div>

              <div>
                <label className={styles.fieldLabel}>Offer Description / Mentorship Details</label>
                <textarea
                  className={styles.textareaInput}
                  value={popupForm.message || ''}
                  onChange={(e) => setPopupForm({ ...popupForm, message: e.target.value })}
                  placeholder="Enter details of the batch, mentorship, or scholarship..."
                  rows={2}
                />
              </div>

              <div>
                <label className={styles.fieldLabel}>Banner Creative Image URL</label>
                <input
                  type="text"
                  className={styles.textInput}
                  value={popupForm.imageUrl}
                  onChange={(e) => setPopupForm({ ...popupForm, imageUrl: e.target.value })}
                  placeholder="/img/dk-results-banner.jpeg or https://..."
                  required
                />
                <div className={styles.presetImagesList}>
                  <span style={{ fontSize: '11px', color: '#64748b', alignSelf: 'center' }}>Presets:</span>
                  <button
                    type="button"
                    className={styles.presetBtn}
                    onClick={() => setPopupForm({ ...popupForm, imageUrl: '/img/dk-results-banner.jpeg' })}
                  >
                    Results Banner
                  </button>
                  <button
                    type="button"
                    className={styles.presetBtn}
                    onClick={() =>
                      setPopupForm({
                        ...popupForm,
                        imageUrl:
                          'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80'
                      })
                    }
                  >
                    Classroom Batch
                  </button>
                  <button
                    type="button"
                    className={styles.presetBtn}
                    onClick={() =>
                      setPopupForm({
                        ...popupForm,
                        imageUrl:
                          'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80'
                      })
                    }
                  >
                    Test Series Special
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className={styles.fieldLabel}>Action Button Text</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={popupForm.buttonText}
                    onChange={(e) => setPopupForm({ ...popupForm, buttonText: e.target.value })}
                    placeholder="Claim Scholarship Now"
                  />
                </div>

                <div>
                  <label className={styles.fieldLabel}>Target Link URL</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={popupForm.linkUrl}
                    onChange={(e) => setPopupForm({ ...popupForm, linkUrl: e.target.value })}
                    placeholder="/courses or /test-series"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className={styles.fieldLabel}>Target Audience</label>
                  <select
                    className={styles.selectInput}
                    value={popupForm.audience}
                    onChange={(e) => setPopupForm({ ...popupForm, audience: e.target.value as any })}
                  >
                    <option value="all">All Visitors (Guest & Logged In)</option>
                    <option value="guest_only">New / Guest Visitors Only</option>
                    <option value="loggedin_only">Logged-in Students Only</option>
                  </select>
                </div>

                <div>
                  <label className={styles.fieldLabel}>Frequency</label>
                  <select
                    className={styles.selectInput}
                    value={popupForm.frequency}
                    onChange={(e) => setPopupForm({ ...popupForm, frequency: e.target.value as any })}
                  >
                    <option value="once_per_session">Once Per Browsing Session</option>
                    <option value="every_visit">Every Visit</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className={styles.saveOfferBtn} style={{ flex: 1 }} disabled={isSavingOffer}>
                  <Check size={16} />
                  <span>{isSavingOffer ? 'Saving...' : 'Save & Publish Popup'}</span>
                </button>

                <button
                  type="button"
                  className={styles.testTriggerBtn}
                  onClick={handleTriggerTestPopup}
                  title="Test how the popup looks on screen right now"
                >
                  <Eye size={16} />
                  <span>Test Popup Live</span>
                </button>
              </div>
            </div>

            {/* Live Miniature Preview */}
            <div className={styles.previewColumn}>
              <div className={styles.previewHeading}>
                <span>Popup Preview</span>
                <span style={{ fontSize: '11px', color: popupForm.isActive ? '#10b981' : '#94a3b8' }}>
                  {popupForm.isActive ? '● Live' : '○ Paused'}
                </span>
              </div>

              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  border: '1px solid #cbd5e1',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ height: '140px', background: '#0f172a', position: 'relative' }}>
                  <img
                    src={popupForm.imageUrl || '/img/dk-results-banner.jpeg'}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/img/dk-results-banner.jpeg';
                    }}
                  />
                  {popupForm.tagText && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        left: '8px',
                        background: '#f59e0b',
                        color: '#fff',
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}
                    >
                      {popupForm.tagText}
                    </span>
                  )}
                </div>

                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    {popupForm.title || 'Special Promotion Heading'}
                  </h4>
                  <p style={{ margin: 0, fontSize: '11.5px', color: '#64748b', lineHeight: 1.4 }}>
                    {popupForm.message || 'Description of the scholarship offer.'}
                  </p>
                  <div
                    style={{
                      marginTop: '6px',
                      background: '#0052cc',
                      color: '#fff',
                      textAlign: 'center',
                      padding: '8px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700
                    }}
                  >
                    {popupForm.buttonText || 'Claim Offer'}
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                Targeting: {popupForm.audience === 'all' ? 'All visitors' : popupForm.audience === 'guest_only' ? 'Guest users' : 'Logged-in students'}. Click <strong>Test Popup Live</strong> to see the full overlay animation.
              </p>
            </div>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: COURSES & TEST SERIES ITEM SALES (1-CLICK & CUSTOM BADGE)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'item_offers' && (
        <div className={styles.offerWorkspaceCard}>
          <div className={styles.offerCardHeader}>
            <div className={styles.offerTitleRow}>
              <h2>Courses & Test Series Item Offers (1-Click Apply & Custom Badges)</h2>
              <p>
                Apply instant percentage or flat discounts directly to Course and Test Series cards with a prominent Custom Badge.
              </p>
            </div>

            <div
              className={styles.switchWrap}
              style={{
                background: itemOfferForm.isActive ? '#ecfdf5' : '#f8fafc',
                borderColor: itemOfferForm.isActive ? '#a7f3d0' : '#e2e8f0',
                color: itemOfferForm.isActive ? '#065f46' : '#64748b'
              }}
              onClick={() => setItemOfferForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
            >
              <span className={`${styles.switchIndicator} ${itemOfferForm.isActive ? styles.switchActive : ''}`} />
              <span>{itemOfferForm.isActive ? '1-CLICK SALE ACTIVE ON SITE' : 'SALE DEACTIVATED'}</span>
            </div>
          </div>

          <form onSubmit={handleSaveItemOffer} className={styles.offerGrid}>
            {/* Form Inputs */}
            <div className={styles.formColumn}>
              <div>
                <label className={styles.fieldLabel}>Offer Campaign Name</label>
                <input
                  type="text"
                  className={styles.textInput}
                  value={itemOfferForm.title}
                  onChange={(e) => setItemOfferForm({ ...itemOfferForm, title: e.target.value })}
                  placeholder="e.g. Diwali Mahabachat Sale, IIT Ranker Special"
                  required
                />
              </div>

              <div>
                <label className={styles.fieldLabel}>
                  Custom Badge Text (Dikhne wala badge)
                </label>
                <input
                  type="text"
                  className={styles.textInput}
                  value={itemOfferForm.badgeText}
                  onChange={(e) => setItemOfferForm({ ...itemOfferForm, badgeText: e.target.value })}
                  placeholder="e.g. 🔥 DIWALI 25% OFF, ⚡ FLASH SALE, SPECIAL 30% OFF"
                  required
                />
                <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Yeh custom badge Course cards and Test Series cards par prominently display hoga.
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className={styles.fieldLabel}>Discount Type</label>
                  <select
                    className={styles.selectInput}
                    value={itemOfferForm.discountType}
                    onChange={(e) => setItemOfferForm({ ...itemOfferForm, discountType: e.target.value as any })}
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Cash Concession (₹)</option>
                  </select>
                </div>

                <div>
                  <label className={styles.fieldLabel}>
                    Discount Value {itemOfferForm.discountType === 'percent' ? '(%)' : '(₹)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={itemOfferForm.discountType === 'percent' ? 100 : 50000}
                    className={styles.textInput}
                    value={itemOfferForm.discountValue}
                    onChange={(e) => setItemOfferForm({ ...itemOfferForm, discountValue: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={styles.fieldLabel}>Target Scope (Kin chizo par apply hoga)</label>
                <select
                  className={styles.selectInput}
                  value={itemOfferForm.targetScope}
                  onChange={(e) => setItemOfferForm({ ...itemOfferForm, targetScope: e.target.value as any })}
                >
                  <option value="all">All Paid Items (Courses & Test Series)</option>
                  <option value="courses">All Courses Only</option>
                  <option value="test-series">All Test Series CBT Mocks Only</option>
                </select>
              </div>

              <div>
                <label className={styles.fieldLabel}>Campaign Subtitle / Details</label>
                <textarea
                  className={styles.textareaInput}
                  value={itemOfferForm.message || ''}
                  onChange={(e) => setItemOfferForm({ ...itemOfferForm, message: e.target.value })}
                  placeholder="e.g. Instant 25% scholarship concession applied on flagship batches."
                  rows={2}
                />
              </div>

              <button
                type="submit"
                className={styles.saveOfferBtn}
                style={{
                  background: itemOfferForm.isActive
                    ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'
                    : '#0052cc'
                }}
                disabled={isSavingOffer}
              >
                <Zap size={16} />
                <span>
                  {isSavingOffer
                    ? 'Applying...'
                    : itemOfferForm.isActive
                    ? 'Save & Apply Live Sale Across Site'
                    : 'Save Changes (Sale Disabled)'}
                </span>
              </button>
            </div>

            {/* Live Card Preview Column */}
            <div className={styles.previewColumn}>
              <div className={styles.previewHeading}>
                <span>Live Card & Price Calculation Preview</span>
                <span style={{ fontSize: '11px', color: itemOfferForm.isActive ? '#15803d' : '#94a3b8' }}>
                  {itemOfferForm.isActive ? '● Live' : '○ Inactive'}
                </span>
              </div>

              <div className={styles.mockCardsWrap}>
                {/* 1. Mock Course Card */}
                <div className={styles.mockCardItem}>
                  <div className={styles.mockCardHeader}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#0052cc' }}>Course Card Preview</span>
                    <span className={styles.mockCustomBadge}>
                      <Sparkles size={10} />
                      <span>{itemOfferForm.badgeText || 'SPECIAL OFFER'}</span>
                    </span>
                  </div>

                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    JEE Main & Advanced 2-Yr Ultimate Flagship Batch
                  </h4>

                  <div className={styles.mockPricingRow}>
                    <span className={styles.mockCurrentPrice}>
                      ₹{mockDiscountedCoursePrice.toLocaleString('en-IN')}
                    </span>
                    <span className={styles.mockOriginalPrice}>
                      ₹{mockCoursePrice.toLocaleString('en-IN')}
                    </span>
                    <span className={styles.mockSavingsPill}>
                      Save ₹{mockDiscountAmount.toLocaleString('en-IN')} (
                      {itemOfferForm.discountType === 'percent'
                        ? `${itemOfferForm.discountValue}% OFF`
                        : `Flat ₹${itemOfferForm.discountValue} OFF`}
                      )
                    </span>
                  </div>
                </div>

                {/* 2. Mock Test Series Card */}
                <div className={styles.mockCardItem}>
                  <div className={styles.mockCardHeader}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#7c3aed' }}>Test Series Card Preview</span>
                    <span className={styles.mockCustomBadge}>
                      <Sparkles size={10} />
                      <span>{itemOfferForm.badgeText || 'SPECIAL OFFER'}</span>
                    </span>
                  </div>

                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    All India CBT Mock Test Series (NTA Simulated)
                  </h4>

                  <div className={styles.mockPricingRow}>
                    <span className={styles.mockCurrentPrice}>
                      ₹{mockDiscountedTestPrice.toLocaleString('en-IN')}
                    </span>
                    <span className={styles.mockOriginalPrice}>
                      ₹{mockTestPrice.toLocaleString('en-IN')}
                    </span>
                    <span className={styles.mockSavingsPill}>
                      Save ₹{mockTestDiscount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                When active, the custom badge automatically appears on all Course cards and Test Series cards, and the price discount is automatically reflected both on the card and during checkout.
              </p>
            </div>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          COUPON CREATE / EDIT MODAL
          ───────────────────────────────────────────────────────────── */}
      {isCouponModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsCouponModalOpen(false)}>
          <div className={styles.couponModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <div className={styles.modalIconWrap}>
                  <Tag size={20} color="#0052cc" />
                </div>
                <div>
                  <h3>{editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Discount Coupon'}</h3>
                  <p>Configure redemption parameters, discount percentage or flat amount, and usage limit.</p>
                </div>
              </div>
              <button
                type="button"
                className={styles.closeModalBtn}
                onClick={() => setIsCouponModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className={styles.modalForm}>
              {formError && (
                <div className={styles.formErrorBanner}>
                  <AlertCircle size={15} />
                  <span>{formError}</span>
                </div>
              )}

              <div className={styles.formRow}>
                <div className={styles.formCol}>
                  <label>Coupon Code *</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                    placeholder="e.g. KOTA25"
                    disabled={Boolean(editingCoupon)}
                    required
                  />
                  <span className={styles.fieldHelperText}>Uppercase alphanumeric letters only</span>
                </div>

                <div className={styles.formCol}>
                  <label>Discount Type *</label>
                  <select
                    value={formDiscountType}
                    onChange={(e) => setFormDiscountType(e.target.value as any)}
                  >
                    <option value="percent">Percentage (%) Concession</option>
                    <option value="flat">Flat Concession (₹)</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formCol}>
                  <label>Discount Value *</label>
                  <input
                    type="number"
                    min="1"
                    max={formDiscountType === 'percent' ? 100 : 50000}
                    value={formDiscountValue}
                    onChange={(e) => setFormDiscountValue(Number(e.target.value))}
                    required
                  />
                  <span className={styles.fieldHelperText}>
                    {formDiscountType === 'percent' ? 'e.g. 15 for 15% discount' : 'e.g. 1000 for ₹1,000 discount'}
                  </span>
                </div>

                <div className={styles.formCol}>
                  <label>Student Limit (Max Redemptions) *</label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={formUsageLimit}
                    onChange={(e) => setFormUsageLimit(Number(e.target.value))}
                    required
                  />
                  <span className={styles.fieldHelperText}>Number of students who can redeem this code</span>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formCol}>
                  <label>Minimum Course Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formMinCoursePrice}
                    onChange={(e) => setFormMinCoursePrice(Number(e.target.value))}
                    placeholder="1000"
                  />
                  <span className={styles.fieldHelperText}>Valid only for courses at or above this value</span>
                </div>

                <div className={styles.formCol}>
                  <label>Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formRowFull}>
                <label>Offer Label (Public display) *</label>
                <input
                  type="text"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  placeholder="e.g. 15% OFF Early Bird Merit Scholarship"
                />
              </div>

              <div className={styles.formRowFull}>
                <label>Internal Description / Notes</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. For Janakpuri classroom students enrolling in advance"
                  rows={2}
                />
              </div>

              <div className={styles.checkboxRow}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                  />
                  <span>Active & Redeemable Immediately</span>
                </label>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelModalBtn}
                  onClick={() => setIsCouponModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitModalBtn}
                  disabled={isSubmittingCoupon}
                >
                  {isSubmittingCoupon ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <AdminConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.type === 'bulk' ? `Delete ${selectedIds.length} Coupons?` : 'Delete Discount Coupon?'}
        message={
          confirmModal.type === 'bulk'
            ? `Are you sure you want to permanently delete all ${selectedIds.length} selected discount coupons? Students will no longer be able to redeem these codes.`
            : `Are you sure you want to delete coupon code "${confirmModal.coupon?.code}"? Students will no longer be able to use it during enrollment.`
        }
        confirmText={confirmModal.type === 'bulk' ? `Delete All (${selectedIds.length})` : 'Delete Coupon'}
        variant="danger"
        onConfirm={handleConfirmAction}
        onClose={() => setConfirmModal({ isOpen: false, type: 'single' })}
      />
    </div>
  );
};
