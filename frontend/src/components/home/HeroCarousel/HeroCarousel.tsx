import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Award,
  BookOpen,
  FileText,
  Target
} from 'lucide-react';
import { Container } from '../../ui/Container/Container';
import { HERO_SLIDES } from '../../../data/homepageRedesignData';
import type { HeroSlide } from '../../../types';
import styles from './HeroCarousel.module.scss';

const SLIDE_DURATION = 5500;

export const HeroCarousel: React.FC = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);
  const totalSlides = HERO_SLIDES.length;

  const nextSlide = useCallback(() => {
    setCurrentIdx((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentIdx((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (idx: number) => {
    setCurrentIdx(idx);
  };

  // Autoplay effect
  useEffect(() => {
    if (isPaused) return;

    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    const interval = setInterval(() => {
      nextSlide();
    }, SLIDE_DURATION);

    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      prevSlide();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
    } else if (e.key === 'Home') {
      setCurrentIdx(0);
    } else if (e.key === 'End') {
      setCurrentIdx(totalSlides - 1);
    }
  };

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartXRef.current || !touchEndXRef.current) return;
    const distance = touchStartXRef.current - touchEndXRef.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      // Swiped left
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      // Swiped right
      prevSlide();
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  const getVisualIcon = (type: HeroSlide['visualType']) => {
    switch (type) {
      case 'jee-main':
        return <Target size={28} />;
      case 'jee-advanced':
        return <Award size={28} />;
      case 'dpp-pyq':
        return <FileText size={28} />;
      case 'free-mastery':
      default:
        return <BookOpen size={28} />;
    }
  };

  return (
    <section
      className={styles.heroSection}
      aria-label="Promotional Carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
    >
      <Container size="wide">
        <div
          className={styles.carouselContainer}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Previous Slide Button */}
          <button
            type="button"
            className={`${styles.navButton} ${styles.prevBtn}`}
            onClick={prevSlide}
            aria-label="Previous promotional slide"
          >
            <ChevronLeft size={22} />
          </button>

          {/* Next Slide Button */}
          <button
            type="button"
            className={`${styles.navButton} ${styles.nextBtn}`}
            onClick={nextSlide}
            aria-label="Next promotional slide"
          >
            <ChevronRight size={22} />
          </button>

          {/* Slides Container */}
          <div className={styles.slidesWrapper}>
            {HERO_SLIDES.map((slide, idx) => {
              const isActive = idx === currentIdx;
              return (
                <div
                  key={slide.id}
                  className={`${styles.slide} ${styles[`theme_${slide.theme}`]} ${
                    isActive ? styles.active : ''
                  }`}
                  aria-hidden={!isActive}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${idx + 1} of ${totalSlides}: ${slide.title}`}
                >
                  {slide.bannerImage ? (
                    <div className={styles.imageBannerWrapper}>
                      <Link
                        to={slide.primaryCta.to}
                        className={styles.imageBannerLink}
                        aria-label={`${slide.title} — Click to explore batches`}
                      >
                        <img
                          src={slide.bannerImage}
                          alt={slide.title}
                          className={styles.imageBannerImg}
                          loading={idx === 0 ? 'eager' : 'lazy'}
                        />
                        <div className={styles.imageBannerFloatingBadge}>
                          <span className={styles.pulseDot} />
                          <span>Admissions Open 2026–2027 • Explore Batches</span>
                          <ArrowRight size={14} />
                        </div>
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className={styles.decorativeMesh} />
                      <div className={styles.slideInner}>
                        {/* Left text column */}
                        <div className={styles.contentCol}>
                          <div className={styles.campaignBadge}>
                            <span className={styles.badgeDot} />
                            <span>{slide.badge}</span>
                          </div>

                          <h1 className={styles.slideTitle}>{slide.title}</h1>

                          <p className={styles.slideSubtitle}>{slide.subtitle}</p>

                          <div className={styles.featuresList}>
                            {slide.features.map((feat, fIdx) => (
                              <div key={fIdx} className={styles.featureItem}>
                                <CheckCircle2 size={16} className={styles.checkIcon} />
                                <span>{feat}</span>
                              </div>
                            ))}
                          </div>

                          <div className={styles.actionsGroup}>
                            <Link to={slide.primaryCta.to} className={styles.primaryCta}>
                              <span>{slide.primaryCta.label}</span>
                              <ArrowRight size={17} />
                            </Link>
                            <Link to={slide.secondaryCta.to} className={styles.secondaryCta}>
                              <span>{slide.secondaryCta.label}</span>
                            </Link>
                          </div>
                        </div>

                        {/* Right visual card column */}
                        <div className={styles.visualCol}>
                          <div className={styles.graphicCard}>
                            <div className={styles.cardTopRow}>
                              <div className={styles.cardIconBox}>
                                {getVisualIcon(slide.visualType)}
                              </div>
                              <div className={styles.highlightPill}>
                                <Sparkles size={14} />
                                <span>{slide.highlightText}</span>
                              </div>
                            </div>

                            <div className={styles.graphicStats}>
                              {slide.stats.map((stat, sIdx) => (
                                <div key={sIdx} className={styles.statItem}>
                                  <span className={styles.statValue}>{stat.value}</span>
                                  <span className={styles.statLabel}>{stat.label}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination Indicators */}
          <div className={styles.indicators} role="tablist" aria-label="Slide selectors">
            {HERO_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={idx === currentIdx}
                aria-label={`Go to slide ${idx + 1}: ${slide.badge}`}
                className={`${styles.indicatorDot} ${
                  idx === currentIdx ? styles.activeDot : ''
                }`}
                onClick={() => goToSlide(idx)}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};
