import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Star,
  Quote,
  Play,
  Pause,
  X,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  GraduationCap,
  Trophy,
  ShieldCheck
} from 'lucide-react';
import { Container } from '../../ui/Container/Container';
import styles from './StudentStories.module.scss';

export interface StoryItem {
  id: string;
  name: string;
  score: string;
  collegeOrRank: string;
  examTag: string;
  quote: string;
  highlightTopic: string;
  avatarText: string;
  avatarImage?: string;
  videoDuration: string;
  videoSrc: string;
}

const STORIES_LIST: StoryItem[] = [
  {
    id: 'story-1',
    name: 'Aarav Sharma',
    score: '99.85 %ile in Mathematics',
    collegeOrRank: 'IIT Bombay • Computer Science',
    examTag: 'AIR 8 (JEE Adv)',
    quote: "The Limits, Continuity & Calculus series completely changed my perception of mathematics. DK Sir's 20–30s inspection shortcuts saved me at least 15 minutes during the actual exam.",
    highlightTopic: 'Calculus & Shortcuts',
    avatarText: 'AS',
    avatarImage: '/images/students/aarav.jpg',
    videoDuration: '0:41',
    videoSrc: '/videos/story-aarav.mp4'
  },
  {
    id: 'story-2',
    name: 'Priya Singhania',
    score: 'AIR 894 in JEE Advanced',
    collegeOrRank: 'IIT Delhi • Mechanical Engineering',
    examTag: '100%ile JEE Main',
    quote: 'Solving King’s and Queen’s definite integration used to take 6 to 7 lines of tedious algebra. DK Academy taught me conceptual symmetry that made multi-concept problems intuitive.',
    highlightTopic: 'Definite Integration',
    avatarText: 'PS',
    avatarImage: '/images/students/priya.jpg',
    videoDuration: '1:15',
    videoSrc: '/videos/story-priya.mp4'
  },
  {
    id: 'story-3',
    name: 'Rohan Verma',
    score: '99.4 %ile in JEE Main',
    collegeOrRank: 'IIT Roorkee',
    examTag: 'JEE Advanced',
    quote: 'The small batch size at the Janakpuri center meant every single doubt was addressed directly by DK Sir. The daily DPP sets and error logs eliminated all silly calculation mistakes.',
    highlightTopic: 'PYQs & Error Logs',
    avatarText: 'RV',
    avatarImage: '/images/students/rohan.jpg',
    videoDuration: '0:43',
    videoSrc: '/videos/story-rohan.mp4'
  }
];

export interface StudentStoriesProps {
  badge?: string;
  title?: string;
  subtitle?: string;
}

export const StudentStories: React.FC<StudentStoriesProps> = ({ badge, title, subtitle }) => {
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [showPlayIconPulse, setShowPlayIconPulse] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const activeStory = activeStoryIndex !== null ? STORIES_LIST[activeStoryIndex] : null;

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Open a specific story
  const openStory = useCallback((index: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActiveStoryIndex(index);
    setCurrentTime(0);
    setIsPlaying(true);
  }, []);

  // Close story modal
  const closeStory = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setActiveStoryIndex(null);
    setCurrentTime(0);
    setIsPlaying(false);
  }, []);

  // Toggle play/pause safely with browser policy fallback
  const togglePlay = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('[Video Player]: Autoplay with sound restricted, retrying muted', err);
            video.muted = true;
            setIsMuted(true);
            video.play()
              .then(() => setIsPlaying(true))
              .catch(() => setIsPlaying(false));
          });
      }
    } else {
      video.pause();
      setIsPlaying(false);
    }

    setShowPlayIconPulse(true);
    setTimeout(() => setShowPlayIconPulse(false), 500);
  }, []);

  // Toggle mute
  const toggleMute = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!videoRef.current) return;
    const nextMuted = !videoRef.current.muted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!videoRef.current) return;
    if (!document.fullscreenElement) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, []);

  // Seek timeline
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  // Navigate next / prev story
  const handleNextStory = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveStoryIndex((prev) => {
      if (prev === null) return 0;
      return (prev + 1) % STORIES_LIST.length;
    });
    setCurrentTime(0);
    setIsPlaying(true);
  }, []);

  const handlePrevStory = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveStoryIndex((prev) => {
      if (prev === null) return 0;
      return (prev - 1 + STORIES_LIST.length) % STORIES_LIST.length;
    });
    setCurrentTime(0);
    setIsPlaying(true);
  }, []);

  // Update progress
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 0);
  };

  // Autoplay video on modal open or story switch with browser policy fallback
  useEffect(() => {
    if (activeStoryIndex === null) return;
    const timer = setTimeout(() => {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = 0;

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.warn('[Video Player]: Audio autoplay blocked, attempting muted playback:', err);
            video.muted = true;
            setIsMuted(true);
            video.play()
              .then(() => setIsPlaying(true))
              .catch((e) => {
                console.warn('[Video Player]: Playback failed:', e);
                setIsPlaying(false);
              });
          });
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [activeStoryIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (activeStoryIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeStory();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowRight') {
        handleNextStory();
      } else if (e.key === 'ArrowLeft') {
        handlePrevStory();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStoryIndex, closeStory, togglePlay, handleNextStory, handlePrevStory, toggleMute, toggleFullscreen]);

  return (
    <section className={styles.section} id="student-stories" aria-labelledby="student-stories-heading">
      <Container size="wide">
        <div className={styles.headerRow}>
          {/* Eyebrow Badge */}
          <div className={styles.eyebrowBadge}>
            <span className={styles.pulseDot} aria-hidden="true" />
            <Sparkles size={13} className={styles.eyebrowIcon} aria-hidden="true" />
            <span>{badge || "PROVEN SUCCESS • AUTHENTIC STUDENT JOURNEYS"}</span>
          </div>

          {/* Section Headline */}
          <h2 id="student-stories-heading" className={styles.sectionTitle}>
            {title ? title : (
              <>
                Hear Directly From Our <span className={styles.titleGradient}>Top Achievers</span>
              </>
            )}
          </h2>

          {/* Subtitle */}
          <p className={styles.sectionSubtitle}>
            {subtitle || "Real student experiences on how DK Sir's concept-first methodology and small batch guidance transformed their problem-solving speed."}
          </p>
        </div>

        {/* 3-Column Stories Cards Grid */}
        <div className={styles.storiesGrid} role="region" aria-label="Student testimonials grid">
          {STORIES_LIST.map((story, idx) => (
            <article
              key={story.id}
              className={`${styles.card} ${idx === 0 ? styles.featuredCard : ''}`}
              aria-label={`Story of ${story.name}`}
              onClick={() => openStory(idx)}
              style={{ cursor: 'pointer' }}
            >
              {/* Decorative Subtle Quote Watermark */}
              <Quote size={64} className={styles.quoteWatermark} aria-hidden="true" />

              <div className={styles.cardTop}>
                <div className={styles.studentInfo}>
                  <div
                    className={styles.avatarCircle}
                    onClick={(e) => openStory(idx, e)}
                    title="Click to watch student video"
                    role="button"
                    tabIndex={0}
                  >
                    {story.avatarImage ? (
                      <img src={story.avatarImage} alt={story.name} className={styles.cardAvatarImg} />
                    ) : (
                      <span className={styles.avatarInitials}>{story.avatarText}</span>
                    )}
                    <span className={styles.playBadge} title="Video story available">
                      <Play size={10} fill="currentColor" />
                    </span>
                  </div>
                  <div className={styles.studentDetails}>
                    <h3 className={styles.studentName}>{story.name}</h3>
                    <div className={styles.collegePill}>
                      <GraduationCap size={13} className={styles.collegeIcon} aria-hidden="true" />
                      <span>{story.collegeOrRank}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.examTagWrap}>
                  <span className={styles.examBadge}>{story.examTag}</span>
                </div>
              </div>

              {/* Rating Stars & Verified Tag */}
              <div className={styles.ratingRow} aria-label="5 out of 5 stars">
                <div className={styles.starsGroup}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} fill="#f59e0b" color="#f59e0b" />
                  ))}
                  <span className={styles.ratingScore}>5.0</span>
                </div>
                <span className={styles.verifiedTag}>
                  <ShieldCheck size={13} className={styles.verifyIcon} aria-hidden="true" />
                  <span>Verified Student</span>
                </span>
              </div>

              {/* Score Highlight Box */}
              <div className={styles.scoreBox}>
                <div className={styles.trophyIconBox}>
                  <Trophy size={16} className={styles.trophyIcon} aria-hidden="true" />
                </div>
                <div className={styles.scoreTextCol}>
                  <span className={styles.scoreLabel}>Validated Score / Rank</span>
                  <span className={styles.scoreValue}>{story.score}</span>
                </div>
              </div>

              {/* Quote */}
              <div className={styles.quoteWrapper}>
                <p className={styles.quoteText}>&ldquo;{story.quote}&rdquo;</p>
              </div>

              {/* Card Bottom: Topic Tag & Watch Story Button */}
              <div className={styles.cardBottom}>
                <span className={styles.topicTag}>
                  <Sparkles size={12} className={styles.topicIcon} aria-hidden="true" />
                  <span>{story.highlightTopic}</span>
                </span>
                <button
                  type="button"
                  className={styles.watchStoryBtn}
                  onClick={(e) => openStory(idx, e)}
                  aria-label={`Watch ${story.name}'s story`}
                >
                  <div className={styles.playBtnCircle}>
                    <Play size={11} fill="currentColor" aria-hidden="true" />
                  </div>
                  <span>Watch Story</span>
                  <span className={styles.videoLength}>({story.videoDuration})</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </Container>

      {/* Compact 9:16 Story Popup Modal (Reel / Mobile Story Style - Teleported via Portal) */}
      {activeStory && activeStoryIndex !== null && typeof document !== 'undefined' && createPortal(
        <div
          className={styles.modalBackdrop}
          onClick={closeStory}
          role="dialog"
          aria-modal="true"
          aria-label={`Student Story: ${activeStory.name}`}
        >
          {/* Desktop Left Navigation Arrow */}
          <button
            type="button"
            className={styles.desktopSideNavBtn}
            onClick={(e) => {
              e.stopPropagation();
              handlePrevStory(e);
            }}
            aria-label="Previous Student Story"
            title="Previous (Left Arrow)"
          >
            <ChevronLeft size={24} />
          </button>

          {/* 9:16 Compact Reel Popup Frame */}
          <div className={styles.storyCard916} onClick={(e) => e.stopPropagation()}>
            {/* 1. Top Story Segmented Progress Bars (Instagram Reel Style) */}
            <div className={styles.storyProgressSegments}>
              {STORIES_LIST.map((_, idx) => {
                let fillPercent = 0;
                if (idx < activeStoryIndex) fillPercent = 100;
                else if (idx === activeStoryIndex) {
                  fillPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
                }
                return (
                  <div key={idx} className={styles.progressSegmentTrack}>
                    <div
                      className={styles.progressSegmentFill}
                      style={{ width: `${fillPercent}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* 2. Top Header Overlay */}
            <div className={styles.storyTopHeader}>
              <div className={styles.studentMetaLeft}>
                <div className={styles.headerAvatar}>
                  {activeStory.avatarImage ? (
                    <img src={activeStory.avatarImage} alt={activeStory.name} className={styles.headerAvatarImg} />
                  ) : (
                    <span>{activeStory.avatarText}</span>
                  )}
                </div>
                <div className={styles.headerTextGroup}>
                  <div className={styles.nameBadgeRow}>
                    <span className={styles.studentNameText}>{activeStory.name}</span>
                    <span className={styles.examTagBadge}>{activeStory.examTag}</span>
                  </div>
                  <span className={styles.collegeSubText}>{activeStory.collegeOrRank}</span>
                </div>
              </div>

              {/* Action Buttons: Sound & Close */}
              <div className={styles.headerActionsRight}>
                <button
                  type="button"
                  className={styles.headerActionBtn}
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                  title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                >
                  {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
                <button
                  type="button"
                  className={styles.headerActionBtn}
                  onClick={closeStory}
                  aria-label="Close"
                  title="Close (Esc)"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Unmute Prompt Pill if Autoplayed Muted */}
            {isMuted && (
              <button
                type="button"
                className={styles.unmutePromptBadge}
                onClick={toggleMute}
                aria-label="Tap to unmute video"
              >
                <VolumeX size={13} />
                <span>Tap to Unmute</span>
              </button>
            )}

            {/* 3. The 9:16 Video Canvas */}
            <div className={styles.videoCanvas}>
              <video
                ref={videoRef}
                src={activeStory.videoSrc}
                className={styles.videoElement}
                autoPlay
                playsInline
                preload="auto"
                muted={isMuted}
                onClick={togglePlay}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => handleNextStory()}
              />

              {/* Big Center Play Button when Paused */}
              {!isPlaying && (
                <div className={styles.centerPausedOverlay} onClick={togglePlay}>
                  <div className={styles.bigPlayCircle}>
                    <Play size={40} fill="#ffffff" color="#ffffff" />
                  </div>
                  <span className={styles.tapToPlayHint}>Tap to Play</span>
                </div>
              )}

              {/* Center Play/Pause Animated Pulse */}
              {showPlayIconPulse && isPlaying && (
                <div className={styles.centerPulse}>
                  <Play size={36} fill="#ffffff" color="#ffffff" />
                </div>
              )}

              {/* Tap Left / Right Navigation Zones */}
              <div
                className={styles.tapZoneLeft}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevStory(e);
                }}
                title="Previous Story"
              />
              <div
                className={styles.tapZoneRight}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextStory(e);
                }}
                title="Next Story"
              />
            </div>

            {/* 4. Bottom Overlay: Student Testimonial & Compact Scrubber */}
            <div className={styles.storyBottomOverlay}>
              <div className={styles.scorePill}>
                <Sparkles size={12} color="#fbbf24" />
                <span>{activeStory.score}</span>
              </div>

              <p className={styles.studentQuoteText}>
                &ldquo;{activeStory.quote}&rdquo;
              </p>

              {/* Compact Bottom Scrubber Controls */}
              <div className={styles.compactControlsRow}>
                <button
                  type="button"
                  className={styles.bottomPlayPauseBtn}
                  onClick={togglePlay}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
                </button>

                <div className={styles.scrubberWrapper}>
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    step="0.1"
                    value={currentTime}
                    onChange={handleSeek}
                    className={styles.compactScrubber}
                    aria-label="Seek story progress"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                        duration ? (currentTime / duration) * 100 : 0
                      }%, rgba(255,255,255,0.2) ${duration ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.2) 100%)`
                    }}
                  />
                </div>

                <span className={styles.compactTimeText}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Right Navigation Arrow */}
          <button
            type="button"
            className={styles.desktopSideNavBtn}
            onClick={(e) => {
              e.stopPropagation();
              handleNextStory(e);
            }}
            aria-label="Next Student Story"
            title="Next (Right Arrow)"
          >
            <ChevronRight size={24} />
          </button>
        </div>,
        document.body
      )}
    </section>
  );
};

export default StudentStories;
