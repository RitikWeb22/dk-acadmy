import { apiClient } from './apiClient';

export interface BannerOfferData {
  id?: string;
  _id?: string;
  offerType: 'banner';
  title: string;
  tagText: string;
  message: string;
  linkText: string;
  linkUrl: string;
  badgeColor?: string;
  isActive: boolean;
  priority?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PopupOfferData {
  id?: string;
  _id?: string;
  offerType: 'popup';
  title: string;
  tagText?: string;
  message?: string;
  imageUrl: string;
  buttonText: string;
  linkUrl: string;
  audience: 'all' | 'guest_only' | 'loggedin_only';
  frequency: 'every_visit' | 'once_per_session' | 'once_per_day';
  hasDiscount?: boolean;
  discountType?: 'percent' | 'flat';
  discountValue?: number;
  couponCode?: string;
  discountBadge?: string;
  autoApplyOnRedirect?: boolean;
  isActive: boolean;
  priority?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ItemOfferData {
  id?: string;
  _id?: string;
  offerType: 'item_discount';
  title: string;
  badgeText: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  targetScope: 'all' | 'courses' | 'test-series' | 'custom';
  applicableItemIds?: string[];
  message?: string;
  isActive: boolean;
  priority?: number;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AnyOfferData = BannerOfferData | PopupOfferData | ItemOfferData;

export interface AllOffersPayload {
  all: AnyOfferData[];
  bannerOffer: BannerOfferData | null;
  popupOffer: PopupOfferData | null;
  itemOffers: ItemOfferData[];
}

export const OFFERS_EVENT_KEY = 'dk_offers_updated';
const STORAGE_KEY = 'dk_academy_offers_v2';

const DEFAULT_OFFERS: AllOffersPayload = {
  all: [
    {
      id: 'off_banner_default',
      offerType: 'banner',
      title: 'Top Page Announcement Banner',
      tagText: 'SPECIAL ADMISSION ALERT',
      message: 'JEE Main & Advanced 2026-27 Batches Open! Avail up to 90% Merit Scholarship + Study Material.',
      linkText: 'Explore Batches',
      linkUrl: '/courses',
      isActive: true,
      priority: 1
    },
    {
      id: 'off_popup_default',
      offerType: 'popup',
      title: 'Flagship Batch - Limited Admission Offer!',
      tagText: 'EXCLUSIVE SCHOLARSHIP',
      message: 'Direct mentorship under Dharmendra Kumar (DK Sir) with 20-30s math inspection shortcuts, daily DPPs & CBT test series.',
      imageUrl: '/img/dk-results-banner.jpeg',
      buttonText: 'Claim Scholarship & Enroll Now',
      linkUrl: '/courses',
      audience: 'all',
      frequency: 'once_per_session',
      isActive: true,
      priority: 1
    },
    {
      id: 'off_item_default',
      offerType: 'item_discount',
      title: 'IIT-JEE Merit Flash Sale',
      badgeText: '🔥 SPECIAL 25% OFF',
      discountType: 'percent',
      discountValue: 25,
      targetScope: 'all',
      applicableItemIds: [],
      message: 'Instant 25% discount applied across all premium flagship courses and CBT mock series.',
      isActive: true,
      priority: 1
    }
  ],
  bannerOffer: {
    id: 'off_banner_default',
    offerType: 'banner',
    title: 'Top Page Announcement Banner',
    tagText: 'SPECIAL ADMISSION ALERT',
    message: 'JEE Main & Advanced 2026-27 Batches Open! Avail up to 90% Merit Scholarship + Study Material.',
    linkText: 'Explore Batches',
    linkUrl: '/courses',
    isActive: true,
    priority: 1
  },
  popupOffer: {
    id: 'off_popup_default',
    offerType: 'popup',
    title: 'Flagship Batch - Limited Admission Offer!',
    tagText: 'EXCLUSIVE SCHOLARSHIP',
    message: 'Direct mentorship under Dharmendra Kumar (DK Sir) with 20-30s math inspection shortcuts, daily DPPs & CBT test series.',
    imageUrl: '/img/dk-results-banner.jpeg',
    buttonText: 'Claim Scholarship & Enroll Now',
    linkUrl: '/courses',
    audience: 'all',
    frequency: 'once_per_session',
    isActive: true,
    priority: 1
  },
  itemOffers: [
    {
      id: 'off_item_default',
      offerType: 'item_discount',
      title: 'IIT-JEE Merit Flash Sale',
      badgeText: '🔥 SPECIAL 25% OFF',
      discountType: 'percent',
      discountValue: 25,
      targetScope: 'all',
      applicableItemIds: [],
      message: 'Instant 25% discount applied across all premium flagship courses and CBT mock series.',
      isActive: true,
      priority: 1
    }
  ]
};

class OfferService {
  private getLocalData(): AllOffersPayload {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.saveLocalData(DEFAULT_OFFERS);
        return DEFAULT_OFFERS;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_OFFERS;
    }
  }

  private saveLocalData(data: AllOffersPayload, emitEvent = true) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      if (emitEvent) {
        window.dispatchEvent(new CustomEvent(OFFERS_EVENT_KEY, { detail: data }));
        window.dispatchEvent(new Event('storage'));
      }
    } catch (err) {
      console.warn('[OfferService] Failed saving to localStorage:', err);
    }
  }

  public async getAllOffers(forceEmit = false): Promise<AllOffersPayload> {
    try {
      const res = await apiClient.get<any>('/offers');
      if (res && res.success && res.data) {
        const payload: AllOffersPayload = {
          all: res.data.all || [],
          bannerOffer: res.data.bannerOffer || null,
          popupOffer: res.data.popupOffer || null,
          itemOffers: res.data.itemOffers || []
        };
        // Save and conditionally notify listeners
        this.saveLocalData(payload, forceEmit);
        return payload;
      }
    } catch (err) {
      console.warn('[OfferService] Falling back to local offers cache:', err);
    }
    return this.getLocalData();
  }

  public getBannerOfferSync(): BannerOfferData | null {
    const data = this.getLocalData();
    const banner = data.bannerOffer || (data.all.find((o) => o.offerType === 'banner' && o.isActive) as BannerOfferData);
    return banner && banner.isActive ? banner : null;
  }

  public getPopupOfferSync(): PopupOfferData | null {
    const data = this.getLocalData();
    const popup = data.popupOffer || (data.all.find((o) => o.offerType === 'popup' && o.isActive) as PopupOfferData);
    return popup && popup.isActive ? popup : null;
  }

  public getItemOffersSync(): ItemOfferData[] {
    const data = this.getLocalData();
    return data.itemOffers || (data.all.filter((o) => o.offerType === 'item_discount') as ItemOfferData[]);
  }

  /**
   * Save or Update an Offer (Banner, Popup, or Item Flash Discount)
   */
  public async saveOffer(offer: AnyOfferData): Promise<AnyOfferData> {
    const id = offer.id || offer._id || `off_${Date.now()}`;
    const payload = { ...offer, id };

    try {
      await apiClient.post('/offers', payload);
    } catch (err: any) {
      console.warn('[OfferService] Local update due to API fallback:', err.message);
    }

    const current = this.getLocalData();
    const existingIndex = current.all.findIndex(
      (o) =>
        o.id === id ||
        o._id === id ||
        (o.offerType === payload.offerType &&
          (payload.offerType === 'banner' || payload.offerType === 'popup' || payload.offerType === 'item_discount'))
    );
    let updatedAll: AnyOfferData[];

    if (existingIndex >= 0) {
      updatedAll = [...current.all];
      updatedAll[existingIndex] = { ...updatedAll[existingIndex], ...payload };
    } else {
      updatedAll = [payload, ...current.all];
    }

    const bannerOffer = (updatedAll.find((o) => o.offerType === 'banner' && o.isActive) ||
      updatedAll.find((o) => o.offerType === 'banner') || null) as BannerOfferData | null;
    const popupOffer = (updatedAll.find((o) => o.offerType === 'popup' && o.isActive) ||
      updatedAll.find((o) => o.offerType === 'popup') || null) as PopupOfferData | null;
    const itemOffers = updatedAll.filter((o) => o.offerType === 'item_discount') as ItemOfferData[];

    const newPayload: AllOffersPayload = {
      all: updatedAll,
      bannerOffer,
      popupOffer,
      itemOffers
    };

    this.saveLocalData(newPayload);
    return payload;
  }

  /**
   * Toggle Offer active status with one click
   */
  public async toggleOffer(idOrType: string): Promise<boolean> {
    const current = this.getLocalData();
    const target = current.all.find(
      (o) => o.id === idOrType || o._id === idOrType || o.offerType === idOrType
    );
    if (!target) return false;

    const nextState = !target.isActive;
    target.isActive = nextState;

    try {
      await apiClient.patch(`/offers/${target._id || target.id || idOrType}/toggle`, {});
    } catch (err: any) {
      console.warn('[OfferService] Toggling locally:', err.message);
    }

    const bannerOffer = (current.all.find((o) => o.offerType === 'banner' && o.isActive) ||
      current.all.find((o) => o.offerType === 'banner') || null) as BannerOfferData | null;
    const popupOffer = (current.all.find((o) => o.offerType === 'popup' && o.isActive) ||
      current.all.find((o) => o.offerType === 'popup') || null) as PopupOfferData | null;
    const itemOffers = current.all.filter((o) => o.offerType === 'item_discount') as ItemOfferData[];

    this.saveLocalData({
      ...current,
      bannerOffer,
      popupOffer,
      itemOffers
    });

    return true;
  }

  /**
   * Delete an Offer
   */
  public async deleteOffer(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/offers/${id}`);
    } catch (err: any) {
      console.warn('[OfferService] Deleting locally:', err.message);
    }

    const current = this.getLocalData();
    const filteredAll = current.all.filter((o) => o.id !== id && o._id !== id);

    const bannerOffer = (filteredAll.find((o) => o.offerType === 'banner' && o.isActive) ||
      filteredAll.find((o) => o.offerType === 'banner') || null) as BannerOfferData | null;
    const popupOffer = (filteredAll.find((o) => o.offerType === 'popup' && o.isActive) ||
      filteredAll.find((o) => o.offerType === 'popup') || null) as PopupOfferData | null;
    const itemOffers = filteredAll.filter((o) => o.offerType === 'item_discount') as ItemOfferData[];

    this.saveLocalData({
      all: filteredAll,
      bannerOffer,
      popupOffer,
      itemOffers
    });

    return true;
  }

  /**
   * Calculate effective discount and badge for a course or test-series
   * Checks for any active item discount that matches the scope or specific item ID.
   */
  public getEffectiveItemOffer(
    itemId: string | undefined,
    itemType: 'course' | 'test-series',
    originalPrice: number
  ): {
    hasOffer: boolean;
    badgeText: string;
    offerTitle: string;
    discountedPrice: number;
    discountAmount: number;
    discountPercent: number;
    activeOffer: ItemOfferData | null;
  } {
    if (!originalPrice || originalPrice <= 0) {
      return {
        hasOffer: false,
        badgeText: '',
        offerTitle: '',
        discountedPrice: 0,
        discountAmount: 0,
        discountPercent: 0,
        activeOffer: null
      };
    }

    const itemOffers = this.getItemOffersSync();
    // Find the first active offer matching scope or item ID
    const activeOffer = itemOffers.find((offer) => {
      if (!offer.isActive) return false;

      if (offer.targetScope === 'all') return true;
      if (offer.targetScope === 'courses' && itemType === 'course') return true;
      if (offer.targetScope === 'test-series' && itemType === 'test-series') return true;
      if (offer.targetScope === 'custom' && itemId && offer.applicableItemIds?.includes(itemId)) {
        return true;
      }
      return false;
    });

    if (!activeOffer) {
      return {
        hasOffer: false,
        badgeText: '',
        offerTitle: '',
        discountedPrice: originalPrice,
        discountAmount: 0,
        discountPercent: 0,
        activeOffer: null
      };
    }

    let discountAmount = 0;
    let discountPercent = 0;

    if (activeOffer.discountType === 'percent') {
      discountPercent = Math.min(100, Math.max(1, activeOffer.discountValue));
      discountAmount = Math.round((originalPrice * discountPercent) / 100);
    } else {
      discountAmount = Math.min(originalPrice, activeOffer.discountValue);
      discountPercent = Math.round((discountAmount / originalPrice) * 100);
    }

    const discountedPrice = Math.max(0, originalPrice - discountAmount);

    return {
      hasOffer: true,
      badgeText: activeOffer.badgeText || (activeOffer.discountType === 'percent' ? `${activeOffer.discountValue}% OFF` : `₹${activeOffer.discountValue} OFF`),
      offerTitle: activeOffer.title,
      discountedPrice,
      discountAmount,
      discountPercent,
      activeOffer
    };
  }
}

export const offerService = new OfferService();

