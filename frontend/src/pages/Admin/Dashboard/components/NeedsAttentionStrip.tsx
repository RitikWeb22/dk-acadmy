import React from 'react';
import {
  AlertTriangle,
  FolderLock,
  PhoneCall,
  RefreshCw,
  Server,
  ArrowRight
} from 'lucide-react';
import type { NeedsAttentionItem } from '../types';
import { Badge } from './Badge';
import styles from './NeedsAttentionStrip.module.scss';

interface NeedsAttentionStripProps {
  items: NeedsAttentionItem[];
  onActionClick: (item: NeedsAttentionItem) => void;
}

export const NeedsAttentionStrip: React.FC<NeedsAttentionStripProps> = ({
  items,
  onActionClick
}) => {
  const getItemIcon = (type: NeedsAttentionItem['type']) => {
    switch (type) {
      case 'batch':
        return <FolderLock size={15} />;
      case 'lead':
        return <PhoneCall size={15} />;
      case 'payment':
        return <RefreshCw size={15} />;
      case 'engine':
        return <Server size={15} />;
      default:
        return <AlertTriangle size={15} />;
    }
  };

  const getIconWrapClass = (type: NeedsAttentionItem['type']) => {
    switch (type) {
      case 'batch':
        return styles.iconWrapAmber;
      case 'lead':
        return styles.iconWrapRose;
      case 'payment':
        return styles.iconWrapRose;
      case 'engine':
        return styles.iconWrapEmerald;
      default:
        return styles.iconWrapAmber;
    }
  };

  return (
    <section className={styles.stripSection} aria-label="Actionable System Alerts">
      <div className={styles.stripHeader}>
        <div className={styles.titleRow}>
          <div className={styles.pulseDot} />
          <h2 className={styles.sectionHeading}>Needs Attention (4)</h2>
        </div>
        <span className={styles.headerSubtitle}>
          Pending actions across enrollment rosters, urgent callbacks, and payment exceptions
        </span>
      </div>

      <div className={styles.cardsTrack}>
        {items.map((item) => (
          <div key={item.id} className={styles.attentionCard}>
            <div className={styles.cardTop}>
              <div className={styles.titleGroup}>
                <div className={`${styles.iconWrap} ${getIconWrapClass(item.type)}`}>
                  {getItemIcon(item.type)}
                </div>
                <div className={styles.titleTextCol}>
                  <span className={styles.itemTitle}>{item.title}</span>
                  <span className={styles.itemTime}>{item.timestamp}</span>
                </div>
              </div>

              <Badge variant={item.badgeVariant}>
                {item.badgeText}
              </Badge>
            </div>

            <p className={styles.description}>{item.description}</p>

            <div className={styles.cardBottom}>
              <button
                type="button"
                className={styles.ctaButton}
                onClick={() => onActionClick(item)}
              >
                <span>{item.ctaText}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
