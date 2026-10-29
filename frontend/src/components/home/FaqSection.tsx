import React, { useState } from 'react';
import { ChevronDown, Send, MessageCircle, HelpCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Container } from '../ui/Container/Container';
import { SectionHeading } from '../ui/SectionHeading/SectionHeading';
import { FAQS_DATA } from '../../data/homepageData';
import styles from './FaqSection.module.scss';

type FaqCategory = 'All' | 'Lectures & YouTube' | 'Practice & PYQ' | 'Batches & Courses' | 'Mentorship & Notes';

export const FaqSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<FaqCategory>('All');
  const [openId, setOpenId] = useState<string | null>('faq-1');

  const filteredFaqs = activeCategory === 'All'
    ? FAQS_DATA
    : FAQS_DATA.filter((item) => item.category === activeCategory);

  const toggleFaq = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className={styles.section} id="faq" aria-labelledby="faq-heading">
      <Container size="wide">
        <SectionHeading
          eyebrow="Got Questions?"
          title="Frequently Asked Questions"
          description="Everything you need to know about our free video lectures, Daily Practice Problems, test series, and mentorship."
          align="center"
        />

        {/* Filter categories */}
        <div className={styles.categoryTabs} role="tablist" aria-label="FAQ Category Filter">
          {(['All', 'Lectures & YouTube', 'Practice & PYQ', 'Batches & Courses', 'Mentorship & Notes'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={activeCategory === cat}
              className={`${styles.catBtn} ${activeCategory === cat ? styles.activeCat : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Two-column layout: Side Mascot Card + Accordion List */}
        <div className={styles.layout}>
          {/* Mascot Side Card */}
          <aside className={styles.mascotCard}>
            <div className={styles.mascotCardInner}>
              <div className={styles.mascotAvatarWrap}>
                <div className={styles.avatarAmbientGlow} />
                <img
                  src="/images/mascot-faq.png"
                  alt="DK Academy Doubt Resolution Mascot"
                  className={styles.mascotImage}
                  loading="lazy"
                />
              </div>

              <div className={styles.mascotText}>
                <div className={styles.mascotBadge}>
                  <Sparkles size={14} className={styles.sparkle} />
                  <span>Doubt Resolution & Strategy</span>
                </div>
                <h3 className={styles.mascotTitle}>Have a Specific Math Query?</h3>
                <p className={styles.mascotDesc}>
                  Our educators and peer mentors are active daily on our official Telegram group to resolve chapter queries, share formula cheat sheets, and conduct live strategy AMAs.
                </p>

                <div className={styles.mascotActions}>
                  <a
                    href="https://t.me"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.telegramBtn}
                  >
                    <Send size={16} />
                    <span>Join Telegram Group</span>
                  </a>

                  <Link to="/about" className={styles.aboutLink}>
                    <HelpCircle size={16} />
                    <span>Learn About DK Academy</span>
                  </Link>
                </div>

                <div className={styles.mascotFooterNote}>
                  <MessageCircle size={14} className={styles.activeDot} />
                  <span>Daily active peer discussions & verified notes</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Accordion Questions List */}
          <div className={styles.accordionList} role="region" aria-label="Frequently Asked Questions Accordion">
            {filteredFaqs.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <div
                  key={faq.id}
                  className={`${styles.accordionItem} ${isOpen ? styles.itemOpen : ''}`}
                >
                  <button
                    type="button"
                    className={styles.accordionHeader}
                    onClick={() => toggleFaq(faq.id)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${faq.id}`}
                  >
                    <div className={styles.questionMeta}>
                      <span className={styles.catTag}>{faq.category}</span>
                      <span className={styles.questionText}>{faq.question}</span>
                    </div>
                    <span className={`${styles.chevronWrap} ${isOpen ? styles.chevronRotated : ''}`}>
                      <ChevronDown size={18} />
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      id={`faq-answer-${faq.id}`}
                      className={styles.accordionBody}
                      role="region"
                    >
                      <p className={styles.answerText}>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
};
