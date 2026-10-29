import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Flame, ChevronLeft, ChevronRight, ArrowRight, TrendingUp } from 'lucide-react';
import { Container } from '../../ui/Container/Container';
import { SectionHeading } from '../../ui/SectionHeading/SectionHeading';
import { TRENDING_SLIDES } from '../../../data/homepageRedesignData';
import styles from './TrendingCarousel.module.scss';

const ROTATION_INTERVAL = 6000;

export const TrendingCarousel: React.FC = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const total = TRENDING_SLIDES.length;
  const touchStartXRef = useRef<number | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentIdx((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    setCurrentIdx((prev) => (prev - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    if (isPaused) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    const timer = setInterval(() => {
      nextSlide();
    }, ROTATION_INTERVAL);

    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartXRef.current) return;
    const endX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - endX;
    if (diff > 45) {
      nextSlide();
    } else if (diff < -45) {
      prevSlide();
    }
    touchStartXRef.current = null;
  };

  return (
    <section
      className={styles.section}
      aria-label="Trending Updates"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <Container size="wide">
        <div className={styles.headerRow}>
          <SectionHeading
            eyebrow="Platform Highlights"
            title="What's Trending"
            description="High-impact study plans, question marathons, and blueprint updates for JEE aspirants."
            align="left"
          />
        </div>

        <div
          className={styles.carouselWrapper}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Side Navigation Buttons positioned on the content */}
          <button
            type="button"
            className={`${styles.navBtn} ${styles.prevBtn}`}
            onClick={prevSlide}
            aria-label="Previous trending slide"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            className={`${styles.navBtn} ${styles.nextBtn}`}
            onClick={nextSlide}
            aria-label="Next trending slide"
          >
            <ChevronRight size={20} />
          </button>

          <div className={styles.slidesTrack}>
            {TRENDING_SLIDES.map((slide, idx) => {
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
                  aria-label={`${idx + 1} of ${total}: ${slide.title}`}
                >
                  <div className={styles.slideContent}>
                    <div className={styles.infoSide}>
                      <div className={styles.badgeRow}>
                        <span className={styles.trendingPill}>
                          <Flame size={14} />
                          <span>{slide.badge}</span>
                        </span>
                        <span className={styles.tagText}>{slide.tag}</span>
                      </div>

                      <h3 className={styles.slideTitle}>{slide.title}</h3>
                      <p className={styles.slideDesc}>{slide.description}</p>

                      <div className={styles.statHighlight}>
                        <TrendingUp size={15} />
                        <span>{slide.stat}</span>
                      </div>
                    </div>

                    <div className={styles.actionSide}>
                      <Link to={slide.ctaLink} className={styles.ctaBtn}>
                        <span>{slide.ctaText}</span>
                        <ArrowRight size={17} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.paginationDots}>
            {TRENDING_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                className={`${styles.dot} ${idx === currentIdx ? styles.activeDot : ''}`}
                onClick={() => setCurrentIdx(idx)}
                aria-label={`Go to trending slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};
