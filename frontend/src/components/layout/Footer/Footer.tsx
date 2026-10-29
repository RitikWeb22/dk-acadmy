import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Send,
  MessageCircle
} from 'lucide-react';
import { Container } from '../../ui/Container/Container';
import { cmsService, CMS_EVENT_KEY } from '../../../services/cmsService';
import type { FooterConfig } from '../../../types/admin';
import styles from './Footer.module.scss';

const CURRENT_YEAR = new Date().getFullYear();

export const Footer: React.FC = () => {
  const [footerConfig, setFooterConfig] = useState<FooterConfig>(() => cmsService.getFooterConfig());

  useEffect(() => {
    // 1. Initial fetch from MongoDB Atlas
    cmsService.fetchFooterFromAPI().then((config) => {
      if (config) {
        setFooterConfig(config);
      }
    }).catch(() => {});

    // 2. Custom event in same tab
    const handleCmsUpdate = (e: any) => {
      const detailType = e?.detail?.type;
      if (!detailType || detailType === 'footer') {
        setFooterConfig(cmsService.getFooterConfig());
      }
    };
    window.addEventListener(CMS_EVENT_KEY, handleCmsUpdate);

    // 3. Storage event across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'dk_academy_cms_footer_v1' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && typeof parsed === 'object') {
            setFooterConfig(parsed);
          }
        } catch {
          setFooterConfig(cmsService.getFooterConfig());
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(CMS_EVENT_KEY, handleCmsUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <footer id="site-footer" className={styles.footer} role="contentinfo" aria-label="DK Academy JEE footer">
      <Container size="wide">
        <div className={styles.topSection}>
          {/* Brand & Address Column */}
          <div className={styles.brandCol}>
            <Link to="/" className={styles.brandLink} aria-label="DK Academy JEE Homepage">
              <img src={footerConfig.logoUrl || '/img/logo.jpeg'} alt={footerConfig.brandName} className={styles.footerLogoImg} />
              <span className={styles.brandName}>
                {footerConfig.brandName} <span className={styles.brandTag}>{footerConfig.brandTag}</span>
              </span>
            </Link>

            <p className={styles.brandDesc}>
              {footerConfig.description}
            </p>

            {/* Real Delhi Center Address */}
            <div className={styles.officeAddress}>
              <MapPin size={16} className={styles.addressIcon} aria-hidden="true" />
              <span>{footerConfig.janakpuriAddress}</span>
            </div>

            {/* Real Contact Numbers & WhatsApp Callouts */}
            <div className={styles.contactChipsRow}>
              <a href={`tel:${footerConfig.phone1.replace(/[^0-9]/g, '')}`} className={styles.contactChip} aria-label={`Call admissions at ${footerConfig.phone1}`}>
                <Phone size={13} aria-hidden="true" />
                <span>{footerConfig.phone1}</span>
              </a>
              <a href={`tel:${footerConfig.phone2.replace(/[^0-9]/g, '')}`} className={styles.contactChip} aria-label={`Call center at ${footerConfig.phone2}`}>
                <Phone size={13} aria-hidden="true" />
                <span>{footerConfig.phone2}</span>
              </a>
              <a
                href={`https://wa.me/${footerConfig.whatsappNumber || '919325987875'}?text=Hi%20DK%20Sir,%20I%20want%20information%20regarding%20IIT%20JEE%20Mathematics%20batches`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.contactChip} ${styles.whatsappChip}`}
                aria-label="Chat on WhatsApp with DK Academy"
              >
                <MessageCircle size={13} aria-hidden="true" />
                <span>WhatsApp</span>
              </a>
            </div>

            {/* Official Channels */}
            <div className={styles.socialRow}>
              <span className={styles.socialLabel}>Official Channels:</span>
              <a
                href={footerConfig.socialLinks?.youtube || "https://www.youtube.com/@DKAcademyJEE"}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="DK Academy JEE YouTube Channel"
                title="YouTube: @DKAcademyJEE"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a
                href="https://in.linkedin.com/in/dharmendra-kumar-67735a55"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="Dharmendra Kumar (DK Sir) LinkedIn Profile"
                title="LinkedIn: Dharmendra Kumar"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
              <a
                href={footerConfig.socialLinks?.telegram || "https://t.me"}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="DK Academy JEE Telegram Community"
              >
                <Send size={14} />
              </a>
            </div>
          </div>

          {/* Learning Resources Links */}
          <div className={styles.linksCol}>
            <h3 className={styles.colTitle}>Academic Programs</h3>
            <ul className={styles.linkList}>
              {footerConfig.learningLinks
                ?.filter((item) => item.isVisible !== false)
                .map((item) => (
                  <li key={item.id || item.path}>
                    <Link to={item.path} className={styles.footerLink}>
                      {item.label}
                      {item.badge && <span style={{ marginLeft: 6, fontSize: 10, background: '#f59e0b', color: '#fff', padding: '2px 6px', borderRadius: 4 }}>{item.badge}</span>}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>

          {/* Subjects Navigation */}
          <div className={styles.linksCol}>
            <h3 className={styles.colTitle}>Syllabus Disciplines</h3>
            <ul className={styles.linkList}>
              {footerConfig.subjectLinks
                ?.filter((item) => item.isVisible !== false)
                .map((item) => (
                  <li key={item.id || item.path}>
                    <Link to={item.path} className={styles.footerLink}>
                      {item.label}
                    </Link>
                  </li>
                ))}
            </ul>
            <div className={styles.quickContactNote}>
              <span className={styles.contactNoteLabel}>Student Inquiries</span>
              <a href={`mailto:${footerConfig.emailAdmissions || 'admissions@dkacademy.com'}`} className={styles.contactMailLink}>
                <Mail size={14} aria-hidden="true" /> {footerConfig.emailAdmissions || 'admissions@dkacademy.com'}
              </a>
            </div>
          </div>

          {/* Platform & Policies */}
          <div className={styles.linksCol}>
            <h3 className={styles.colTitle}>Policies &amp; Legal</h3>
            <ul className={styles.linkList}>
              {footerConfig.policyLinks
                ?.filter((item) => item.isVisible !== false)
                .map((item) => (
                  <li key={item.id || item.path}>
                    <Link to={item.path} className={styles.footerLink}>
                      <ShieldCheck size={13} className={styles.policyIcon} aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar — Single Unified Row without duplicates */}
        <div className={styles.bottomBar}>
          <p className={styles.copyright}>
            © {CURRENT_YEAR} {footerConfig.copyrightText}
          </p>
        </div>
      </Container>
    </footer>
  );
};
