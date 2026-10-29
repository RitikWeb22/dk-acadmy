import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Container } from '../../ui/Container/Container';
import { SectionHeading } from '../../ui/SectionHeading/SectionHeading';
import styles from './FaqAccordion.module.scss';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    id: 'faq-batch-dates',
    question: 'When do new batches start for JEE 2026 and 2027?',
    answer: 'Class 11th 2-Year Comprehensive and Dropper Ranker batches start on the 1st and 3rd Monday of every month. Class 12th Fast-Track batches and Class 8th–10th Foundation batches start on the first Monday of each month. Small batch sizes (max 25 students) ensure individual seat availability is strictly monitored.'
  },
  {
    id: 'faq-refund-policy',
    question: 'What is your refund and cancellation policy?',
    answer: 'We provide a transparent 7-day evaluation window from your first enrolled session. If you feel the teaching speed or conceptual approach does not suit your study habits, you can submit a refund request to receive a 100% refund of course tuition fees (excluding printed materials dispatched). Full details are outlined in our Refund Policy.'
  },
  {
    id: 'faq-language',
    question: 'What is the medium of instruction / language used in classes?',
    answer: 'All masterclasses are conducted in Hinglish (concept explanations and problem breakdown in conversational Hindi, while mathematical notations, technical terms, formula derivations, and question sheets are in English).'
  },
  {
    id: 'faq-doubt-support',
    question: 'How does doubt resolution work for online and classroom students?',
    answer: 'Students can ask doubts live during interactive lectures, attend post-class 30-minute offline doubt clinics at our Dwarka and Janakpuri centers, and submit question screenshots directly to DK Sir and faculty mentors on our dedicated student Telegram channel with same-day step-by-step resolution.'
  },
  {
    id: 'faq-emi-options',
    question: 'Are no-cost EMI or monthly installment options available?',
    answer: 'Yes. We support 3, 6, and 9-month zero-interest EMI options through major debit and credit cards, as well as split-fee installment plans for year-long programs. Speak with our admissions counselors to configure your installment schedule.'
  }
];

export interface FaqAccordionProps {
  badge?: string;
  title?: string;
  subtitle?: string;
}

export const FaqAccordion: React.FC<FaqAccordionProps> = ({ badge, title, subtitle }) => {
  const [openId, setOpenId] = useState<string | null>('faq-batch-dates');

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className={styles.section} id="faq" aria-labelledby="faq-section-heading">
      <Container size="wide">
        <div className={styles.headerRow}>
          <SectionHeading
            eyebrow={badge || "Clear & Transparent Guidance"}
            title={title || "Frequently Asked Questions"}
            description={subtitle || "Find direct answers regarding batch schedules, fees, classroom policies, and student support."}
            align="center"
          />
        </div>

        <div className={styles.accordionContainer} role="region" aria-label="Frequently Asked Questions list">
          {FAQ_DATA.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className={`${styles.item} ${isOpen ? styles.itemOpen : ''}`}
              >
                <button
                  type="button"
                  id={`accordion-btn-${item.id}`}
                  className={styles.questionBtn}
                  onClick={() => toggle(item.id)}
                  aria-expanded={isOpen}
                  aria-controls={`accordion-panel-${item.id}`}
                >
                  <span className={styles.questionText}>{item.question}</span>
                  <ChevronDown
                    size={20}
                    className={`${styles.chevron} ${isOpen ? styles.chevronRotated : ''}`}
                    aria-hidden="true"
                  />
                </button>

                <div
                  id={`accordion-panel-${item.id}`}
                  role="region"
                  aria-labelledby={`accordion-btn-${item.id}`}
                  className={`${styles.answerPanel} ${isOpen ? styles.panelVisible : styles.panelHidden}`}
                  hidden={!isOpen}
                >
                  <p className={styles.answerText}>{item.answer}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Contact Prompt below FAQ */}
        <div className={styles.contactPrompt}>
          <p>
            Have a question not listed here?{' '}
            <a href="#callback" className="btn-link">
              Request a free callback
            </a>{' '}
            or call our admissions desk at{' '}
            <a href="tel:9325987875" className={styles.phoneLink}>
              +91 93259 87875
            </a>.
          </p>
        </div>
      </Container>
    </section>
  );
};
