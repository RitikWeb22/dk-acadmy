import React, { useEffect, useState } from 'react';
import { AboutHero } from '../../components/about/AboutHero/AboutHero';
import { AboutMethodology } from '../../components/about/AboutMethodology/AboutMethodology';
import { AboutBatches } from '../../components/about/AboutBatches/AboutBatches';
import { AboutPlaylists } from '../../components/about/AboutPlaylists/AboutPlaylists';
import { AboutMentorship } from '../../components/about/AboutMentorship/AboutMentorship';
import { AboutCta } from '../../components/about/AboutCta/AboutCta';
import { cmsService, CMS_EVENT_KEY } from '../../services/cmsService';
import type { PageSectionItem } from '../../types/admin';
import { Container } from '../../components/ui/Container/Container';
import { ArrowRight, Download, FileText } from 'lucide-react';
import styles from './AboutPage.module.scss';

export const AboutPage: React.FC = () => {
  const [aboutConfig, setAboutConfig] = useState(() => cmsService.getPageConfig('about'));

  useEffect(() => {
    document.title = aboutConfig.metaTitle || "About Us & Academic Approach | DK Academy IIT JEE";
    window.scrollTo(0, 0);

    const handleCmsUpdate = () => {
      const updated = cmsService.getPageConfig('about');
      setAboutConfig(updated);
      if (updated.metaTitle) document.title = updated.metaTitle;
    };
    window.addEventListener(CMS_EVENT_KEY, handleCmsUpdate);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'dk_academy_cms_pages_v1') {
        const updated = cmsService.getPageConfig('about');
        setAboutConfig(updated);
        if (updated.metaTitle) document.title = updated.metaTitle;
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(CMS_EVENT_KEY, handleCmsUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [aboutConfig.metaTitle]);

  const customSections = aboutConfig.customSections || [];

  const isSecVisible = (secId: string) => {
    const sec = customSections.find((s) => s.id === secId);
    return !sec || sec.isVisible !== false;
  };

  const coreAboutSectionIds = [
    'sec_about_methodology',
    'sec_about_batches',
    'sec_about_playlists',
    'sec_about_mentorship',
    'sec_about_cta'
  ];

  const extraSections = customSections
    .filter((sec) => !coreAboutSectionIds.includes(sec.id) && sec.isVisible !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const renderExtraSection = (sec: PageSectionItem) => {
    return (
      <section key={sec.id} style={{ padding: '56px 0', borderTop: '1px solid #e2e8f0', background: '#ffffff' }}>
        <Container size="wide">
          {sec.badge && (
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '4px 14px', borderRadius: '9999px', border: '1px solid #bfdbfe' }}>
                {sec.badge}
              </span>
            </div>
          )}
          {sec.title && (
            <h2 style={{ fontSize: '2.15rem', fontWeight: 800, textAlign: 'center', color: '#0f172a', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
              {sec.title}
            </h2>
          )}
          {sec.subtitle && (
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: '1rem', maxWidth: '720px', margin: '0 auto 32px', lineHeight: 1.6 }}>
              {sec.subtitle}
            </p>
          )}

          {/* Banner Type */}
          {sec.type === 'banner' && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px', display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
              {sec.imageUrl && (
                <img src={sec.imageUrl} alt={sec.title} style={{ width: '300px', maxHeight: '200px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              )}
              <div style={{ flex: 1, minWidth: '280px' }}>
                {sec.content && <p style={{ fontSize: '1.05rem', color: '#334155', lineHeight: 1.65, margin: '0 0 18px' }}>{sec.content}</p>}
                {sec.buttonText && (
                  <a href={sec.buttonUrl || '/courses'} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', fontWeight: 600 }}>
                    <span>{sec.buttonText}</span>
                    <ArrowRight size={16} />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Video Type */}
          {sec.type === 'video' && sec.videoUrl && (
            <div style={{ maxWidth: '880px', margin: '0 auto', aspectRatio: '16 / 9', borderRadius: '16px', overflow: 'hidden', background: '#000', boxShadow: '0 12px 30px rgba(0,0,0,0.12)' }}>
              {sec.videoUrl.includes('youtube') || sec.videoUrl.includes('youtu.be') ? (
                <iframe src={sec.videoUrl} title={sec.title} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen />
              ) : (
                <video src={sec.videoUrl} poster={sec.videoThumbnail} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>
          )}

          {/* Cards Type */}
          {sec.type === 'cards' && sec.cards && (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`, gap: '24px' }}>
              {sec.cards.map((card) => (
                <div key={card.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <div>
                    {card.badge && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563eb', background: '#eff6ff', padding: '3px 9px', borderRadius: '6px' }}>
                        {card.badge}
                      </span>
                    )}
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: '10px 0 8px' }}>{card.title}</h3>
                    <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.55 }}>{card.description}</p>
                  </div>
                  {card.linkText && (
                    <a href={card.linkUrl || '/courses'} style={{ marginTop: '18px', fontSize: '0.875rem', fontWeight: 600, color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <span>{card.linkText}</span>
                      <ArrowRight size={14} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Assets Type */}
          {sec.type === 'assets' && sec.assets && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px' }}>
              {sec.assets.map((asset) => (
                <div key={asset.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <FileText size={26} color="#dc2626" />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>{asset.title}</h4>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{asset.fileSize || 'PDF Document'}</span>
                    </div>
                  </div>
                  <a href={asset.fileUrl} download className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Download size={14} />
                    <span>{asset.buttonText || 'Download'}</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </Container>
      </section>
    );
  };

  return (
    <main className={styles.aboutPage}>
      {/* 1. Hero: Pedagogical Mission & Speed Mastery */}
      <AboutHero />

      {/* 2. Methodology: The Three Pillars */}
      {isSecVisible('sec_about_methodology') && <AboutMethodology />}

      {/* 3. Batches: Structured Programs & Offerings */}
      {isSecVisible('sec_about_batches') && <AboutBatches />}

      {/* 4. Playlists: Major Chapter-Wise YouTube Playlists */}
      {isSecVisible('sec_about_playlists') && <AboutPlaylists />}

      {/* 5. Mentorship: Study Materials & DPP Rigor */}
      {isSecVisible('sec_about_mentorship') && <AboutMentorship />}

      {/* 6. Extra Custom Visual Sections (if added via Visual Section Builder) */}
      {extraSections.map(renderExtraSection)}

      {/* 7. Call To Action: Ready to Master IIT JEE Mathematics */}
      {isSecVisible('sec_about_cta') && <AboutCta />}
    </main>
  );
};

export default AboutPage;
