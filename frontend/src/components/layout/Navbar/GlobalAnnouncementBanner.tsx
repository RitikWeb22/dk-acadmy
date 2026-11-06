import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, ArrowRight, X, Sparkles } from 'lucide-react';
import { offerService, type BannerOfferData, OFFERS_EVENT_KEY } from '../../../services/offerService';
import styles from './GlobalAnnouncementBanner.module.scss';

export const GlobalAnnouncementBanner: React.FC = () => {
  const [banner, setBanner] = useState<BannerOfferData | null>(() => offerService.getBannerOfferSync());
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Initial fetch from service
    offerService.getAllOffers().then((res) => {
      if (res.bannerOffer && res.bannerOffer.isActive) {
        setBanner(res.bannerOffer);
      } else {
        setBanner(null);
      }
    });

    const handleUpdate = () => {
      const active = offerService.getBannerOfferSync();
      setBanner(active);
    };

    window.addEventListener(OFFERS_EVENT_KEY, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(OFFERS_EVENT_KEY, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  if (!banner || !banner.isActive || isDismissed) {
    return null;
  }

  return (
    <aside className={styles.bannerBar} role="region" aria-label="Special Announcement Banner">
      <div className={styles.contentWrap}>
        <div className={styles.centerContent}>
          {banner.tagText && (
            <span className={styles.tagBadge}>
              <Sparkles size={11} className={styles.tagIcon} aria-hidden="true" />
              <span>{banner.tagText}</span>
            </span>
          )}
          <span className={styles.bannerMessage}>
            {banner.message}
          </span>
          {banner.linkUrl && (
            <Link to={banner.linkUrl} className={styles.ctaLink}>
              <span>{banner.linkText || 'Claim Offer'}</span>
              <ArrowRight size={12} className={styles.ctaArrow} aria-hidden="true" />
            </Link>
          )}
        </div>

        <button
          type="button"
          className={styles.dismissBtn}
          onClick={() => setIsDismissed(true)}
          aria-label="Dismiss announcement banner"
          title="Dismiss banner"
        >
          <X size={14} />
        </button>
      </div>
    </aside>
  );
};

