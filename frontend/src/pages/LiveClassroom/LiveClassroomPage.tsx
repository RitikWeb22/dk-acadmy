import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  Radio,
  Clock,
  Sparkles,
  Zap,
  Mic,
  Video,
  FileText,
  CheckCircle2,
  Bell,
  ArrowRight,
  Play,
  BookOpen,
  ShieldCheck,
  Users,
  Award,
  Send
} from 'lucide-react';
import { Container } from '../../components/ui/Container/Container';
import { useToast } from '../../context/ToastContext';
import styles from './LiveClassroomPage.module.scss';

// Target Launch Date: 15th November 2026, 18:00 IST
const TARGET_LAUNCH_DATE = new Date('2026-11-15T18:00:00+05:30').getTime();

export const LiveClassroomPage: React.FC = () => {
  const { showToast } = useToast();

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Waitlist form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [targetYear, setTargetYear] = useState('JEE 2028 (Class 11th)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [vipTicketId, setVipTicketId] = useState('');

  // Check if user already joined waitlist
  useEffect(() => {
    const existing = localStorage.getItem('dk_live_classroom_waitlist');
    if (existing) {
      try {
        const parsed = JSON.parse(existing);
        setIsJoined(true);
        setVipTicketId(parsed.ticketId || 'DK-LIVE-7842');
      } catch {
        // ignore
      }
    }
  }, []);

  // Countdown tick
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = TARGET_LAUNCH_DATE - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');

    if (!name.trim()) {
      showToast('Please enter your full name', 'error');
      return;
    }

    if (cleanPhone.length !== 10) {
      showToast('Please enter a valid 10-digit WhatsApp/mobile number', 'error');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const randomTicket = `DK-LIVE-${Math.floor(1000 + Math.random() * 9000)}`;
      const payload = {
        name: name.trim(),
        phone: cleanPhone,
        targetYear,
        ticketId: randomTicket,
        joinedAt: new Date().toISOString()
      };

      localStorage.setItem('dk_live_classroom_waitlist', JSON.stringify(payload));
      setVipTicketId(randomTicket);
      setIsJoined(true);
      setIsSubmitting(false);
      showToast('🎉 You have secured your VIP Priority Access Pass for DK Sir Live Classroom!', 'success');
    }, 600);
  };

  return (
    <div className={styles.liveClassroomRoot}>
      <Container size="wide">
        {/* 1. Breadcrumb navigation */}
        <nav aria-label="Breadcrumb" className={styles.breadcrumbStrip}>
          <ol className={styles.breadcrumbList}>
            <li>
              <Link to="/" className={styles.breadcrumbLink}>Home</Link>
            </li>
            <li className={styles.breadcrumbSeparator} aria-hidden="true">
              <ChevronRight size={14} />
            </li>
            <li>
              <span className={styles.breadcrumbActive}>Live Classroom</span>
            </li>
          </ol>
        </nav>

        {/* 2. Hero Coming Soon Announcement Block */}
        <section className={styles.heroSection}>
          {/* Live Status Pill */}
          <div className={styles.liveStatusRow}>
            <span className={styles.livePulsePill}>
              <span className={styles.livePulseDot} />
              <Radio size={14} className={styles.radioIcon} />
              LIVE 2-WAY BROADCAST ENGINE • COMING SOON
            </span>
            <span className={styles.sessionPill}>
              Academic Session 2026–27
            </span>
          </div>

          <h1 className={styles.heroHeading}>
            DK Sir Live Interactive Classroom
          </h1>
          <p className={styles.heroSubheading}>
            Kota coaching rigor delivered straight to your study desk. Experience ultra-low latency live classes, real-time 2-way microphone doubts with DK Sir, and 20-30s speed inspection timer drills.
          </p>

          {/* 3. Live Countdown Timer */}
          <div className={styles.countdownContainer}>
            <div className={styles.countdownHeader}>
              <Clock size={16} className={styles.clockIcon} />
              <span>OFFICIAL LAUNCH COUNTDOWN &amp; BATCH ONBOARDING</span>
            </div>

            <div className={styles.countdownGrid}>
              <div className={styles.timeCard}>
                <span className={styles.timeNumber}>{String(timeLeft.days).padStart(2, '0')}</span>
                <span className={styles.timeLabel}>Days</span>
              </div>
              <div className={styles.timeColon}>:</div>
              <div className={styles.timeCard}>
                <span className={styles.timeNumber}>{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className={styles.timeLabel}>Hours</span>
              </div>
              <div className={styles.timeColon}>:</div>
              <div className={styles.timeCard}>
                <span className={styles.timeNumber}>{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className={styles.timeLabel}>Minutes</span>
              </div>
              <div className={styles.timeColon}>:</div>
              <div className={styles.timeCard}>
                <span className={styles.timeNumber}>{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className={styles.timeLabel}>Seconds</span>
              </div>
            </div>

            <div className={styles.targetDateNote}>
              <span>📅 Target Launch Date: <strong>15 November 2026 • 06:00 PM IST</strong></span>
            </div>
          </div>
        </section>

        {/* 4. VIP Priority Access Waitlist Form */}
        <section className={styles.waitlistSection}>
          <div className={styles.waitlistCard}>
            {isJoined ? (
              <div className={styles.vipPassCard}>
                <div className={styles.passHeader}>
                  <div className={styles.passBadge}>
                    <CheckCircle2 size={16} />
                    <span>VIP Priority Access Confirmed</span>
                  </div>
                  <span className={styles.ticketBadge}>PASS #{vipTicketId}</span>
                </div>

                <h3 className={styles.passTitle}>You're On The Priority Onboarding List!</h3>
                <p className={styles.passSubtitle}>
                  You will receive an exclusive WhatsApp invite with the live stream room key, trial credentials, and handwritten notes 24 hours prior to launch.
                </p>

                <div className={styles.passPerksRow}>
                  <div className={styles.passPerk}>
                    <CheckCircle2 size={14} className={styles.perkIcon} />
                    <span>Guaranteed First-Row Seat</span>
                  </div>
                  <div className={styles.passPerk}>
                    <CheckCircle2 size={14} className={styles.perkIcon} />
                    <span>Direct 2-Way Mic Priority</span>
                  </div>
                  <div className={styles.passPerk}>
                    <CheckCircle2 size={14} className={styles.perkIcon} />
                    <span>Free DPP-01 with Video Solution</span>
                  </div>
                </div>

                <div className={styles.passActions}>
                  <Link to="/courses" className={styles.exploreExistingBtn}>
                    <span>Browse Current Classroom Batches</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            ) : (
              <div className={styles.waitlistFormWrap}>
                <div className={styles.formHeader}>
                  <span className={styles.formMiniTag}>
                    <Sparkles size={13} />
                    Early Access Privilege
                  </span>
                  <h2 className={styles.formTitle}>Join the VIP Live Classroom Waitlist</h2>
                  <p className={styles.formDesc}>
                    Live batches will be strictly capped at 50 students per cohort to guarantee personalized attention. Secure your spot before general admissions open.
                  </p>
                </div>

                <form onSubmit={handleWaitlistSubmit} className={styles.formBody}>
                  <div className={styles.inputGrid}>
                    <div className={styles.formField}>
                      <label htmlFor="student-name" className={styles.inputLabel}>
                        Student Full Name *
                      </label>
                      <input
                        id="student-name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className={styles.textInput}
                      />
                    </div>

                    <div className={styles.formField}>
                      <label htmlFor="student-phone" className={styles.inputLabel}>
                        WhatsApp Number *
                      </label>
                      <input
                        id="student-phone"
                        type="tel"
                        required
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="10-digit mobile number"
                        className={styles.textInput}
                      />
                    </div>

                    <div className={styles.formField}>
                      <label htmlFor="target-year" className={styles.inputLabel}>
                        Target Batch &amp; Academic Year
                      </label>
                      <select
                        id="target-year"
                        value={targetYear}
                        onChange={(e) => setTargetYear(e.target.value)}
                        className={styles.selectInput}
                      >
                        <option value="JEE 2028 (Class 11th)">JEE 2028 • Class 11th (2-Year Cohort)</option>
                        <option value="JEE 2027 (Class 12th)">JEE 2027 • Class 12th (1-Year Fastrack)</option>
                        <option value="JEE 2027 (Droppers)">JEE 2027 • Dropper / Repeater Batch</option>
                        <option value="Foundation (Class 9-10)">Class 9th &amp; 10th Pre-JEE Foundation</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={styles.submitWaitlistBtn}
                  >
                    <Bell size={16} />
                    <span>{isSubmitting ? 'Securing Priority Pass...' : 'Notify Me & Get VIP Early Access Pass'}</span>
                    <ArrowRight size={16} />
                  </button>

                  <div className={styles.privacyNote}>
                    <ShieldCheck size={14} className={styles.shieldIcon} />
                    <span>Zero spam guarantee. We only send live stream link and schedule updates via WhatsApp / SMS.</span>
                  </div>
                </form>
              </div>
            )}
          </div>
        </section>

        {/* 5. What Makes DK Academy Live Classroom Superior (Feature Pillars) */}
        <section className={styles.featuresSection}>
          <div className={styles.sectionHeadingBlock}>
            <span className={styles.sectionPill}>PEDAGOGY USP</span>
            <h2 className={styles.sectionTitle}>Engineered for Active Rank Improvement</h2>
            <p className={styles.sectionSub}>
              Unlike passive broadcast lectures, DK Academy’s Live Classroom is built ground-up for fast mental computation and direct student-teacher interaction.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={`${styles.iconWrap} ${styles.blueIcon}`}>
                <Zap size={22} />
              </div>
              <h3 className={styles.featureTitle}>20-30s Speed Inspection Polls</h3>
              <p className={styles.featureDesc}>
                During live derivations, DK Sir launches rapid timed checks. Students solve problems without traditional multi-step algebra using proprietary Kota inspection heuristics.
              </p>
              <div className={styles.featureBadge}>Speed Rank Leaderboard</div>
            </div>

            <div className={styles.featureCard}>
              <div className={`${styles.iconWrap} ${styles.emeraldIcon}`}>
                <Mic size={22} />
              </div>
              <h3 className={styles.featureTitle}>2-Way Direct Voice Doubts</h3>
              <p className={styles.featureDesc}>
                No typing clumsy LaTeX or long math equations in chat. Simply raise your hand; DK Sir unmutes your microphone so you can discuss the boundary conditions live.
              </p>
              <div className={styles.featureBadge}>Instant Audio Clearance</div>
            </div>

            <div className={styles.featureCard}>
              <div className={`${styles.iconWrap} ${styles.purpleIcon}`}>
                <Video size={22} />
              </div>
              <h3 className={styles.featureTitle}>Ultra-Low Latency 60FPS Stream</h3>
              <p className={styles.featureDesc}>
                Sub-500ms broadcast engine ensures you hear every single word and pen stroke instantaneously with zero awkward buffering, even on 4G cellular networks.
              </p>
              <div className={styles.featureBadge}>1080p Studio Broadcast</div>
            </div>

            <div className={styles.featureCard}>
              <div className={`${styles.iconWrap} ${styles.amberIcon}`}>
                <FileText size={22} />
              </div>
              <h3 className={styles.featureTitle}>Auto Blackboard PDF Sync</h3>
              <p className={styles.featureDesc}>
                Focus on listening and mental derivations without taking notes frantically. The entire live chalkboard is automatically vectorized and saved to your student account within 2 minutes.
              </p>
              <div className={styles.featureBadge}>Cloud Notes Archive</div>
            </div>
          </div>
        </section>

        {/* 6. Quote from DK Sir */}
        <section className={styles.quoteSection}>
          <div className={styles.quoteCard}>
            <div className={styles.quoteMonogram}>DK</div>
            <div className={styles.quoteContent}>
              <blockquote className={styles.quoteText}>
                “In true Kota coaching, solving problems fast isn’t just about memorizing formulas—it is about the rhythm of thinking under timed inspection. Our upcoming Live Classroom brings that exact classroom tempo straight to your screen.”
              </blockquote>
              <div className={styles.authorRow}>
                <span className={styles.authorName}>Dharmendra Kumar (DK Sir)</span>
                <span className={styles.authorTitle}>18+ Yrs Kota Faculty • Ex-Allen / Bansal Math HOD</span>
              </div>
            </div>
          </div>
        </section>

        {/* 7. While You Wait (Immediate Study Alternatives) */}
        <section className={styles.alternativesSection}>
          <div className={styles.alternativesCard}>
            <div className={styles.altText}>
              <h3 className={styles.altTitle}>Don't Want to Wait? Start Learning Right Now</h3>
              <p className={styles.altDesc}>
                Our existing self-paced masterclasses, solved DPP sheets, and CBT All-India test series are available for immediate enrollment.
              </p>
            </div>

            <div className={styles.altButtons}>
              <Link to="/courses" className={styles.primaryAltBtn}>
                <BookOpen size={16} />
                <span>Explore Full Batches</span>
              </Link>
              <Link to="/free-lectures" className={styles.secondaryAltBtn}>
                <Play size={15} fill="currentColor" />
                <span>Watch Free Demos</span>
              </Link>
            </div>
          </div>
        </section>
      </Container>
    </div>
  );
};
export default LiveClassroomPage;
