import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Download,
  Video,
  FileText,
  ChevronRight,
  ExternalLink,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { cmsService } from '../../services/cmsService';
import type { PageContentConfig, PageSectionItem } from '../../types/admin';
import styles from './DynamicCustomPage.module.scss';

export const DynamicCustomPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const pageSlug = slug ? (slug.startsWith('/') ? slug.substring(1) : slug) : 'home';
  const [config, setConfig] = useState<PageContentConfig | null>(null);

  useEffect(() => {
    // 1. Read from CMS service cache
    const cached = cmsService.getPageConfig(pageSlug);
    setConfig(cached);

    // 2. Fetch fresh config from MongoDB
    cmsService.fetchPagesFromAPI().then((pages) => {
      if (pages && pages[pageSlug]) {
        setConfig(pages[pageSlug]);
      }
    }).catch(() => {});

    // Update document title and SEO meta
    if (cached) {
      document.title = cached.metaTitle || `${cached.pageTitle} | DK Academy JEE`;
    }

    // 3. Listen for CMS updates in real-time (same tab)
    const handleCmsUpdate = (e: any) => {
      if (!e.detail || e.detail.type === 'pages' || e.detail.id === pageSlug) {
        const updated = cmsService.getPageConfig(pageSlug);
        setConfig(updated);
        if (updated) {
          document.title = updated.metaTitle || `${updated.pageTitle} | DK Academy JEE`;
        }
      }
    };
    window.addEventListener('dk_cms_updated', handleCmsUpdate);

    // 4. Listen for storage updates across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'dk_academy_cms_pages_v1' && e.newValue) {
        try {
          const all = JSON.parse(e.newValue);
          if (all && all[pageSlug]) {
            setConfig(all[pageSlug]);
          }
        } catch {
          setConfig(cmsService.getPageConfig(pageSlug));
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('dk_cms_updated', handleCmsUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [pageSlug]);

  if (!config) {
    return (
      <div className={styles.pageWrapper} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading educational program...</p>
      </div>
    );
  }

  const sections = (config.customSections || []).filter((s) => s.isVisible);

  return (
    <div className={styles.pageWrapper}>
      {/* ─── Hero Section ─── */}
      <section className={styles.heroContainer}>
        <div className={styles.heroContent}>
          {config.heroBadge && (
            <div className={styles.heroBadge}>
              <Sparkles size={14} />
              <span>{config.heroBadge}</span>
            </div>
          )}

          <h1 className={styles.heroHeading}>
            {config.heroHeading || config.pageTitle}
          </h1>

          {config.heroSubheading && (
            <p className={styles.heroSubheading}>
              {config.heroSubheading}
            </p>
          )}

          <div className={styles.heroActions}>
            {config.primaryCtaText && (
              <a
                href={config.primaryCtaUrl || '/courses'}
                className={styles.primaryCta}
              >
                <span>{config.primaryCtaText}</span>
                <ArrowRight size={16} />
              </a>
            )}

            {config.secondaryCtaText && (
              <a
                href={config.secondaryCtaUrl || '/contact'}
                className={styles.secondaryCta}
              >
                <span>{config.secondaryCtaText}</span>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ─── Sections Container ─── */}
      <main className={styles.sectionsContainer}>
        {sections.map((section) => {
          const type = section.type || 'banner';

          return (
            <section key={section.id} className={styles.sectionBlock}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>{section.title}</h2>
                {section.subtitle && (
                  <p className={styles.sectionSubtitle}>{section.subtitle}</p>
                )}
              </div>

              {/* 1. BANNER SECTION */}
              {type === 'banner' && (
                <div className={styles.bannerCard}>
                  {section.imageUrl && (
                    <div className={styles.bannerImageWrap}>
                      <img src={section.imageUrl} alt={section.title} />
                    </div>
                  )}
                  <div className={styles.bannerTextWrap}>
                    {section.badge && (
                      <span className={styles.bannerBadge}>{section.badge}</span>
                    )}
                    <h3 className={styles.bannerTitle}>{section.title}</h3>
                    {section.content && (
                      <p className={styles.bannerContent}>{section.content}</p>
                    )}
                    {section.buttonText && (
                      <a href={section.buttonUrl || '/courses'} className={styles.bannerBtn}>
                        <span>{section.buttonText}</span>
                        <ChevronRight size={16} />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* 2. VIDEO SHOWCASE SECTION */}
              {type === 'video' && section.videoUrl && (
                <div className={styles.videoWrapper}>
                  <iframe
                    className={styles.videoIframe}
                    src={section.videoUrl}
                    title={section.videoCaption || section.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                  {section.videoCaption && (
                    <div className={styles.videoFooterBar}>
                      <h4 className={styles.videoCaption}>{section.videoCaption}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.8125rem' }}>
                        <Video size={16} color="#ef4444" />
                        <span>Kota Video Lecture Vault</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. CARDS GRID SECTION */}
              {type === 'cards' && section.cards && (
                <div className={`${styles.cardsGrid} ${
                  section.columns === 2 ? styles.gridCol2 : section.columns === 4 ? styles.gridCol4 : styles.gridCol3
                }`}>
                  {section.cards.map((card) => (
                    <div key={card.id} className={styles.featureCard}>
                      <div className={styles.cardTop}>
                        {card.badge && (
                          <div className={styles.cardBadgeRow}>
                            <span className={styles.cardBadge}>{card.badge}</span>
                          </div>
                        )}
                        <h3 className={styles.cardTitle}>{card.title}</h3>
                        <p className={styles.cardDescription}>{card.description}</p>
                      </div>

                      {card.linkText && (
                        <a href={card.linkUrl || '/courses'} className={styles.cardActionLink}>
                          <span>{card.linkText}</span>
                          <ArrowRight size={14} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 4. ASSETS & DOWNLOADS SECTION */}
              {type === 'assets' && section.assets && (
                <div className={styles.assetsGrid}>
                  {section.assets.map((asset) => (
                    <div key={asset.id} className={styles.assetDownloadCard}>
                      <div className={styles.assetIconTile}>
                        <FileText size={22} />
                      </div>
                      <div className={styles.assetMeta}>
                        <h4 className={styles.assetTitle}>{asset.title}</h4>
                        {asset.fileSize && (
                          <span className={styles.assetSize}>
                            {asset.fileType?.toUpperCase()} • {asset.fileSize}
                          </span>
                        )}
                      </div>
                      <a
                        href={asset.fileUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.downloadBtn}
                      >
                        <Download size={14} />
                        <span>{asset.buttonText || 'Download'}</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </main>
    </div>
  );
};

