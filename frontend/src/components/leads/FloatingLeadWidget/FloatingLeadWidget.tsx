import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PhoneCall, MessageCircle } from 'lucide-react';
import { CallbackModal } from '../CallbackModal/CallbackModal';
import styles from './FloatingLeadWidget.module.scss';

export const FloatingLeadWidget: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCallbackOrFooterVisible, setIsCallbackOrFooterVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCbtActive, setIsCbtActive] = useState(false);
  const location = useLocation();

  // Hide on admin routes, auth pages, or student authenticated areas to maintain clean flow
  const isHidden = ['/admin', '/login', '/signup', '/forgot-password', '/reset-password', '/profile', '/classroom'].some((p) =>
    location.pathname.startsWith(p)
  );

  // Monitor fullscreen mode and active CBT test exam mode so Request Callback NEVER shows in fullscreen or exams
  useEffect(() => {
    const checkFullscreenAndExam = () => {
      const fs = Boolean(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(fs);

      const cbt = Boolean(
        document.body.classList.contains('cbt-exam-active') ||
        document.documentElement.classList.contains('cbt-exam-active') ||
        document.querySelector('[class*="fullscreenCbtWrapper"]') ||
        document.querySelector('[class*="TestTakingView"]')
      );
      setIsCbtActive(cbt);
    };

    checkFullscreenAndExam();

    document.addEventListener('fullscreenchange', checkFullscreenAndExam);
    document.addEventListener('webkitfullscreenchange', checkFullscreenAndExam);
    document.addEventListener('mozfullscreenchange', checkFullscreenAndExam);
    document.addEventListener('MSFullscreenChange', checkFullscreenAndExam);
    window.addEventListener('resize', checkFullscreenAndExam);

    const observer = new MutationObserver(checkFullscreenAndExam);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    return () => {
      document.removeEventListener('fullscreenchange', checkFullscreenAndExam);
      document.removeEventListener('webkitfullscreenchange', checkFullscreenAndExam);
      document.removeEventListener('mozfullscreenchange', checkFullscreenAndExam);
      document.removeEventListener('MSFullscreenChange', checkFullscreenAndExam);
      window.removeEventListener('resize', checkFullscreenAndExam);
      observer.disconnect();
    };
  }, []);

  // IntersectionObserver to detect when callback form, hero CTAs, or footer are in viewport (Requirement 2)
  useEffect(() => {
    if (isHidden) return;

    const footerElement =
      document.getElementById('site-footer') || document.querySelector('footer');
    const callbackElement =
      document.getElementById('callback') || document.getElementById('callback-form-heading');
    const heroCtasElement =
      document.getElementById('hero-book-demo-btn') || document.querySelector('[class*="ctaGroup"]');

    let footerIntersecting = false;
    let callbackIntersecting = false;
    let heroIntersecting = false;

    const updateVisibility = () => {
      setIsCallbackOrFooterVisible(footerIntersecting || callbackIntersecting || heroIntersecting);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (footerElement && entry.target === footerElement) {
            footerIntersecting = entry.isIntersecting;
          }
          if (callbackElement && entry.target === callbackElement) {
            callbackIntersecting = entry.isIntersecting;
          }
          if (heroCtasElement && entry.target === heroCtasElement) {
            heroIntersecting = entry.isIntersecting;
          }
        });
        updateVisibility();
      },
      {
        root: null,
        threshold: 0.1
      }
    );

    if (footerElement) observer.observe(footerElement);
    if (callbackElement) observer.observe(callbackElement);
    if (heroCtasElement) observer.observe(heroCtasElement);

    return () => {
      observer.disconnect();
    };
  }, [isHidden, location.pathname]);

  if (isHidden || isFullscreen || isCbtActive) return null;

  return (
    <>
      {/* Unified Floating Action Button (Icon-only 56px circular FAB on mobile, compact pill on desktop) */}
      <div
        className={`${styles.floatingWidgetContainer} ${
          isCallbackOrFooterVisible ? styles.hiddenWhenVisible : ''
        }`}
      >
        <button
          type="button"
          className={styles.fabButton}
          onClick={() => setIsModalOpen(true)}
          aria-label="Request academic callback from senior IIT-JEE mentors"
          title="Schedule Callback &amp; Batch Counseling"
        >
          <div className={styles.iconSlot}>
            <PhoneCall size={20} className={styles.phoneIcon} aria-hidden="true" />
            <MessageCircle size={12} className={styles.waBadgeIcon} aria-hidden="true" />
          </div>
          <span className={styles.btnLabel}>Request Callback</span>
        </button>
      </div>

      {/* Embedded Callback & WhatsApp Modal */}
      <CallbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        source="Floating Lead Widget"
      />
    </>
  );
};

export default FloatingLeadWidget;
