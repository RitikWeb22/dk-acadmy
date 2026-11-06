import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { X, Sparkles, ArrowRight, ExternalLink } from 'lucide-react';
import { useStudentAuth } from '../../../context/AuthContext';
import { offerService, type PopupOfferData, OFFERS_EVENT_KEY } from '../../../services/offerService';
import styles from './PromotionalPopupModal.module.scss';

const POPUP_SESSION_KEY = 'dk_popup_session_dismissed_v1';
export const TRIGGER_PREVIEW_POPUP_EVENT = 'dk_trigger_test_popup';

export const PromotionalPopupModal: React.FC = () => {
  const { isAuthenticated } = useStudentAuth();
  const [popup, setPopup] = useState<PopupOfferData | null>(() => offerService.getPopupOfferSync());
  const [isOpen, setIsOpen] = useState(false);

  const evaluateAndShow = (offerData: PopupOfferData | null, forcePreview = false) => {
    if (!offerData || !offerData.isActive) {
      setIsOpen(false);
      return;
    }

    if (!forcePreview) {
      // Check session dismissal
      if (offerData.frequency === 'once_per_session') {
        const dismissed = sessionStorage.getItem(POPUP_SESSION_KEY);
        if (dismissed === 'true') {
          return;
        }
      }

      // Check audience targeting
      if (offerData.audience === 'guest_only' && isAuthenticated) {
        return;
      }
      if (offerData.audience === 'loggedin_only' && !isAuthenticated) {
        return;
      }
    }

    // Delay slightly for natural entrance on visit
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, forcePreview ? 50 : 1200);

    return () => clearTimeout(timer);
  };

  useEffect(() => {
    // 1. Initial check
    offerService.getAllOffers().then((res) => {
      if (res.popupOffer) {
        setPopup(res.popupOffer);
        evaluateAndShow(res.popupOffer);
      }
    });

    // 2. Listen for offer updates
    const handleOffersUpdate = () => {
      const active = offerService.getPopupOfferSync();
      setPopup(active);
      evaluateAndShow(active);
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
  }, [isAuthenticated]);

  const handleClose = () => {
    sessionStorage.setItem(POPUP_SESSION_KEY, 'true');
    setIsOpen(false);
  };

  if (!isOpen || !popup || typeof document === 'undefined') {
    return null;
  }

  const isExternal = popup.linkUrl?.startsWith('http') || popup.linkUrl?.startsWith('//');

  return createPortal(
    <div
      className={styles.backdrop}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={popup.title || 'Special Promotional Offer'}
    >
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        {/* Floating Close Button */}
        <button
          type="button"
          className={styles.closeBtn}
          onClick={handleClose}
          aria-label="Close promotional offer modal"
        >
          <X size={18} />
        </button>

        {/* Banner Graphic Image */}
        {popup.imageUrl && (
          <div className={styles.imageContainer}>
            <img
              src={popup.imageUrl}
              alt={popup.title}
              className={styles.bannerImage}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/img/dk-results-banner.jpeg';
              }}
            />
            {popup.tagText && (
              <div className={styles.tagBadge}>
                <Sparkles size={12} />
                <span>{popup.tagText}</span>
              </div>
            )}
          </div>
        )}

        {/* Modal Text Content */}
        <div className={styles.modalBody}>
          <h2 className={styles.title}>{popup.title}</h2>
          {popup.message && <p className={styles.message}>{popup.message}</p>}

          <div className={styles.actionsRow}>
            {isExternal ? (
              <a
                href={popup.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.ctaButton}
                onClick={handleClose}
              >
                <span>{popup.buttonText || 'View Offer'}</span>
                <ExternalLink size={15} />
              </a>
            ) : (
              <Link
                to={popup.linkUrl || '/courses'}
                className={styles.ctaButton}
                onClick={handleClose}
              >
                <span>{popup.buttonText || 'Claim Offer Now'}</span>
                <ArrowRight size={15} />
              </Link>
            )}

            <button
              type="button"
              className={styles.skipBtn}
              onClick={handleClose}
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

