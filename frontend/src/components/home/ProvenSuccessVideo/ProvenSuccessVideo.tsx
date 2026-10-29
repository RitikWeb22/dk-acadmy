import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Video,
  Play,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users
} from 'lucide-react';
import { Container } from '../../ui/Container/Container';
import { cmsService, CMS_EVENT_KEY } from '../../../services/cmsService';
import styles from './ProvenSuccessVideo.module.scss';

export const ProvenSuccessVideo: React.FC = () => {
  const [homeConfig, setHomeConfig] = useState(() => cmsService.getPageConfig('home'));

  useEffect(() => {
    const handleCmsUpdate = () => setHomeConfig(cmsService.getPageConfig('home'));
    window.addEventListener(CMS_EVENT_KEY, handleCmsUpdate);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'dk_academy_cms_pages_v1') {
        setHomeConfig(cmsService.getPageConfig('home'));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(CMS_EVENT_KEY, handleCmsUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const videoSec = homeConfig.customSections?.find(
    (s) => s.id === 'sec_home_success_video' || s.type === 'video'
  );

  // If explicitly hidden by admin in CMS, respect that
  if (videoSec && videoSec.isVisible === false) {
    return null;
  }

  const title = videoSec?.title || 'Proven Success and Story View';
  const subtitle =
    videoSec?.subtitle ||
    'Watch real aspirants share their journey to IIT Bombay, Delhi & Roorkee with DK Sir';
  const videoUrl =
    videoSec?.videoUrl ||
    'https://www.youtube.com/embed/dQw4w9WgXcQ';
  const videoCaption =
    videoSec?.videoCaption ||
    'Proven Success: Student Testimonials & Speed Shortcuts with DK Sir';
  const description =
    videoSec?.content ||
    'From struggling with 15-minute calculus derivations to cracking JEE Advanced in 20-30 seconds. Experience the true Kota pedagogy advantage with DK Sir’s proprietary elimination tactics.';
  const thumbnail = videoSec?.videoThumbnail || '/img/founder.jpeg';

  const isYouTube =
    videoUrl.includes('youtube.com') ||
    videoUrl.includes('youtu.be') ||
    videoUrl.includes('embed');

  const scrollToStories = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById('student-stories');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className={styles.section} id="proven-success-video" aria-label="Proven Success Video Showcase">
      <Container size="wide">
        {/* Header Block */}
        <div className={styles.headerBlock}>
          <div className={styles.eyebrowBadge}>
            <Sparkles size={14} aria-hidden="true" />
            <span>PROVEN SUCCESS &amp; STORY VIEW</span>
          </div>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        {/* Video Card Grid */}
        <div className={styles.videoCardGrid}>
          {/* Left Column: Responsive 16:9 Video Player */}
          <div className={styles.videoPlayerWrap}>
            {isYouTube ? (
              <iframe
                src={videoUrl}
                title={videoCaption}
                className={styles.iframeVideo}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={videoUrl}
                poster={thumbnail}
                controls
                className={styles.nativeVideo}
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>

          {/* Right Column: Key Details & Reel Story Action */}
          <div className={styles.infoColumn}>
            <div className={styles.videoMetaBadge}>
              <Video size={16} aria-hidden="true" />
              <span>OFFICIAL VIDEO DOCUMENTARY</span>
            </div>

            <h3 className={styles.videoCaption}>{videoCaption}</h3>
            <p className={styles.videoDescription}>{description}</p>

            <div className={styles.highlightPillsRow}>
              <span className={styles.highlightPill}>
                <ShieldCheck size={14} color="#059669" aria-hidden="true" />
                <span>Verified IIT-JEE Rankers</span>
              </span>
              <span className={styles.highlightPill}>
                <CheckCircle2 size={14} color="#2563eb" aria-hidden="true" />
                <span>20–30s Math Inspection</span>
              </span>
              <span className={styles.highlightPill}>
                <Users size={14} color="#7c3aed" aria-hidden="true" />
                <span>Max 25 Per Batch</span>
              </span>
            </div>

            <div className={styles.actionRow}>
              <a
                href="#student-stories"
                onClick={scrollToStories}
                className={styles.secondaryActionBtn}
              >
                <Play size={15} fill="currentColor" aria-hidden="true" />
                <span>Watch Story Reels</span>
              </a>

              <Link to="/courses" className={styles.primaryActionBtn}>
                <span>Explore Flagship Batches</span>
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default ProvenSuccessVideo;

