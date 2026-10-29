import React, { useEffect, useState } from 'react';
import { SplitHero } from '../../components/home/SplitHero/SplitHero';
import { ResultsBannerStrip } from '../../components/home/ResultsBannerStrip/ResultsBannerStrip';
import { WhyUsSection } from '../../components/home/WhyUsSection';
import { PopularCourses } from '../../components/home/PopularCourses/PopularCourses';
import { AchieversSection } from '../../components/home/AchieversSection/AchieversSection';
import { FounderSection } from '../../components/home/FounderSection/FounderSection';
import { StudentStories } from '../../components/home/StudentStories/StudentStories';
import { FaqAccordion } from '../../components/home/FaqSection/FaqAccordion';
import { CallbackForm } from '../../components/home/CallbackForm/CallbackForm';
import { cmsService, CMS_EVENT_KEY } from '../../services/cmsService';
import type { PageSectionItem } from '../../types/admin';
import { Container } from '../../components/ui/Container/Container';
import { ArrowRight, Download, Video, FileText, ChevronRight } from 'lucide-react';
import styles from './HomePage.module.scss';

export const HomePage: React.FC = () => {
  const [homeConfig, setHomeConfig] = useState(() => cmsService.getPageConfig('home'));

  useEffect(() => {
    // 1. Dynamic SEO Document Title & Meta Description
    document.title = homeConfig.metaTitle || "DK Academy JEE | Crack JEE with DK Sir's 20–30s Math Techniques";

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      'content',
      homeConfig.metaDescription ||
      'Join DK Academy JEE for concept-first IIT JEE Mathematics mentoring under DK Sir. Small batch size (max 25), 20–30s inspection shortcuts, Dwarka & Janakpuri centers. Admissions open 2026–27.'
    );

    // 2. Real-time CMS updates listener (same tab & cross tab)
    const handleCmsUpdate = () => {
      const updated = cmsService.getPageConfig('home');
      setHomeConfig(updated);
      if (updated.metaTitle) document.title = updated.metaTitle;
    };
    window.addEventListener(CMS_EVENT_KEY, handleCmsUpdate);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'dk_academy_cms_pages_v1') {
        const updated = cmsService.getPageConfig('home');
        setHomeConfig(updated);
        if (updated.metaTitle) document.title = updated.metaTitle;
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. JSON-LD Structured Data Schema for EducationalOrganization & Course
    const schemaScriptId = 'dk-academy-jsonld-schema';
    let scriptElement = document.getElementById(schemaScriptId) as HTMLScriptElement | null;
    if (!scriptElement) {
      scriptElement = document.createElement('script');
      scriptElement.id = schemaScriptId;
      scriptElement.type = 'application/ld+json';
      document.head.appendChild(scriptElement);
    }

    const structuredData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "EducationalOrganization",
          "@id": "https://dkacademyjee.com/#organization",
          "name": "DK Academy JEE",
          "founder": {
            "@type": "Person",
            "name": "Dharmendra Kumar (DK Sir)"
          },
          "url": "https://dkacademyjee.com",
          "logo": "https://dkacademyjee.com/img/logo.jpeg",
          "description": "Premier coaching institute for IIT-JEE Mathematics founded by DK Sir. Small batches for Class 8th–10th Foundation and Class 11th–12th & Droppers at Dwarka Sector 12 and Janakpuri, New Delhi.",
          "telephone": ["+91-9325987875", "+91-9717159062"],
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "C4F/33, behind F Market, Janakpuri",
            "addressLocality": "New Delhi",
            "postalCode": "110058",
            "addressCountry": "IN"
          }
        },
        {
          "@type": "Course",
          "name": "Ultimate 2-Year Live Classroom: Target JEE 2028",
          "description": "Comprehensive 2-year PCM program covering Class 11th & 12th NTA JEE syllabus with DK Sir's high-speed mathematical techniques.",
          "provider": {
            "@type": "EducationalOrganization",
            "name": "DK Academy JEE"
          }
        }
      ]
    };

    scriptElement.textContent = JSON.stringify(structuredData);

    return () => {
      window.removeEventListener(CMS_EVENT_KEY, handleCmsUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const customSections = homeConfig.customSections || [];

  const isSecVisible = (secId: string) => {
    const sec = customSections.find((s) => s.id === secId);
    return !sec || sec.isVisible !== false;
  };

  const coreHomeSectionIds = [
    'sec_home_results_banner',
    'sec_home_why_us',
    'sec_home_courses',
    'sec_home_achievers',
    'sec_home_founder',
    'sec_home_stories',
    'sec_home_faqs',
    'sec_home_callback'
  ];

  const extraSections = customSections
    .filter((sec) => !coreHomeSectionIds.includes(sec.id) && sec.isVisible !== false)
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
    <main className={styles.main} id="main-content">
      {/* 1. Hero: Ultra-Modern 2-Column Split Hero with interactive badges, DK Sir spotlight & stats ribbon */}
      <SplitHero />

      {/* 2. Official Results Banner: Sleek reduced height, full rounded borders, placed above The DK Academy Edge */}
      {isSecVisible('sec_home_results_banner') && <ResultsBannerStrip />}

      {/* 3. Core Advantages: The DK Academy Edge (20-30s shortcuts, concept-first, max 25 students, CBT) */}
      {isSecVisible('sec_home_why_us') && <WhyUsSection />}

      {/* 4. Flagship Courses: Interactive filter tabs & baseline-aligned modern course cards */}
      {isSecVisible('sec_home_courses') && <PopularCourses />}

      {/* 5. Live Hall of Fame: Continuous Tilted Marquee with hover-to-pause and zoom */}
      {isSecVisible('sec_home_achievers') && <AchieversSection />}

      {/* 6. Meet Our Founder: DK Sir portrait, teaching philosophy, verified credentials & quote */}
      {isSecVisible('sec_home_founder') && <FounderSection />}

      {/* 7. Student Stories: Verified reviews from IIT Bombay, IIT Delhi & IIT Roorkee alumni */}
      {isSecVisible('sec_home_stories') && <StudentStories />}

      {/* 8. Frequently Asked Questions: Smooth accordion for batch schedules, fees & policies */}
      {isSecVisible('sec_home_faqs') && <FaqAccordion />}

      {/* 9. Extra Custom Visual Sections (if added via Visual Section Builder) */}
      {extraSections.map(renderExtraSection)}

      {/* 10. Request a Callback: Spacious counseling booking & 1-click WhatsApp connect */}
      {isSecVisible('sec_home_callback') && <CallbackForm />}
    </main>
  );
};

export default HomePage;
