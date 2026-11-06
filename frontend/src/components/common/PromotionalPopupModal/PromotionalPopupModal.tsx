import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { offerService, type PopupOfferData, OFFERS_EVENT_KEY } from '../../../services/offerService';
import styles from './PromotionalPopupModal.module.scss';

export const TRIGGER_PREVIEW_POPUP_EVENT = 'dk_trigger_test_popup';

export const PromotionalPopupModal: React.FC = () => {
  const navigate = useNavigate();
  const [popup, setPopup] = useState<PopupOfferData | null>(() => offerService.getPopupOfferSync());
  const [isOpen, setIsOpen] = useState(false);

  const evaluateAndShow = (offerData: PopupOfferData | null, forcePreview = false) => {
    if (!offerData || !offerData.isActive) {
      setIsOpen(false);
      return;
    }

    // Always show on every refresh/page load, whether student is logged in or guest
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, forcePreview ? 50 : 800);

    return () => clearTimeout(timer);
  };

  useEffect(() => {
    // 1. Initial check on mount
    offerService.getAllOffers().then((res) => {
      if (res.popupOffer && res.popupOffer.isActive) {
        setPopup(res.popupOffer);
        evaluateAndShow(res.popupOffer);
      } else {
        setPopup(null);
        setIsOpen(false);
      }
    });

    // 2. Listen for offer updates
    const handleOffersUpdate = () => {
      const active = offerService.getPopupOfferSync();
      setPopup(active);
      if (active && active.isActive) {
        evaluateAndShow(active);
      } else {
        setIsOpen(false);
      }
    };

    // 3. Listen for admin live preview trigger
    const handlePreviewTrigger = (e: any) => {
      const customOffer = e.detail || offerService.getPopupOfferSync();
      if (customOffer) {
        setPopup(customOffer);
        setIsOpen(true);
      }
    };

    window.addEventListener(OFFERS_EVENT_KEY, handleOffersUpdate);
    window.addEventListener(TRIGGER_PREVIEW_POPUP_EVENT, handlePreviewTrigger);

    return () => {
      window.removeEventListener(OFFERS_EVENT_KEY, handleOffersUpdate);
      window.removeEventListener(TRIGGER_PREVIEW_POPUP_EVENT, handlePreviewTrigger);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleBannerClick = () => {
    // Automatically apply promotional offer/discount on click
    try {
      sessionStorage.setItem('dk_popup_offer_applied', 'true');
      if (popup?.couponCode) {
        sessionStorage.setItem('dk_applied_coupon', popup.couponCode.trim().toUpperCase());
      }
      if (popup?.hasDiscount && popup?.discountValue) {
        sessionStorage.setItem('dk_popup_discount_val', String(popup.discountValue));
        sessionStorage.setItem('dk_popup_discount_type', popup.discountType || 'percent');
        if (popup?.discountBadge) {
          sessionStorage.setItem('dk_active_promo_badge', popup.discountBadge);
        }
      } else {
        sessionStorage.setItem(
          'dk_active_promo_badge',
          popup?.discountBadge || popup?.tagText || popup?.title || 'SPECIAL PROMO'
        );
      }
    } catch {
      // ignore
    }

    setIsOpen(false);

    let targetUrl = popup?.linkUrl || '/courses';
    if (popup?.couponCode && !targetUrl.includes('coupon=')) {
      targetUrl += `${targetUrl.includes('?') ? '&' : '?'}coupon=${encodeURIComponent(popup.couponCode.trim().toUpperCase())}`;
    }

    if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
      window.location.href = targetUrl;
    } else {
      navigate(targetUrl);
    }
  };

  if (!isOpen || !popup || !popup.isActive || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className={styles.backdrop}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={popup.title || 'Promotional Offer'}
    >
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        {/* Floating Top-Right Close Button */}
        <button
          type="button"
          className={styles.closeBtn}
          onClick={handleClose}
          aria-label="Close promotional offer modal"
          title="Close modal"
        >
          <X size={18} />
        </button>

        {/* Pure Clickable Banner Graphic - Clicking redirects & auto-applies discount */}
        <div
          className={styles.clickableBannerWrap}
          onClick={handleBannerClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleBannerClick();
            }
          }}
          title={popup.title ? `${popup.title} - Click to apply offer` : 'Click to claim discount'}
        >
          <img
            src={popup.imageUrl || '/img/dk-results-banner.jpeg'}
            alt={popup.title || 'Special Promotion Banner'}
            className={styles.bannerImage}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/img/dk-results-banner.jpeg';
            }}
          />
        </div>
      </div>
    </div>,
    document.body
  );
};

