import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Container } from '../../ui/Container/Container';
import { SectionHeading } from '../../ui/SectionHeading/SectionHeading';
import { SuccessStoryCard } from './SuccessStoryCard';
import { SUCCESS_STORIES } from '../../../data/homepageRedesignData';
import styles from './SuccessStoriesCarousel.module.scss';

export const SuccessStoriesCarousel: React.FC = () => {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  return (
    <section className={styles.section} aria-labelledby="success-stories-heading">
      <Container size="wide">
        <div className={styles.headerRow}>
          <SectionHeading
            eyebrow="Student Experiences"
            title="Student Success Stories"
            description="Authentic perspectives from aspirants who transformed their mathematical and analytical confidence with DK Academy."
            align="left"
          />

          <div className={styles.navArrows}>
            <button
              type="button"
              className={styles.navBtn}
              onClick={scrollLeft}
              aria-label="Scroll success stories left"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className={styles.navBtn}
              onClick={scrollRight}
              aria-label="Scroll success stories right"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          className={styles.carouselTrack}
          role="region"
          aria-label="Student Success Stories carousel"
        >
          {SUCCESS_STORIES.map((story) => (
            <SuccessStoryCard key={story.id} story={story} />
          ))}
        </div>
      </Container>
    </section>
  );
};
