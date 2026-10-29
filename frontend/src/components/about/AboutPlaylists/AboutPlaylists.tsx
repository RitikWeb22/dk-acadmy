import React from 'react';
import { Play, ExternalLink, ArrowUpRight, Users, Eye } from 'lucide-react';
import { YoutubeIcon } from '../../ui/YoutubeIcon/YoutubeIcon';
import { Container } from '../../ui/Container/Container';
import styles from './AboutPlaylists.module.scss';

interface PlaylistCardData {
  title: string;
  topic: string;
  videoCount: string;
  thumbnailUrl: string;
  metaInfo: string;
  views: string;
  description: string;
  focusAreas: string[];
  url: string;
}

export const AboutPlaylists: React.FC = () => {
  const playlists: PlaylistCardData[] = [
    {
      title: 'DK Sir: The Main Mentor Podcast 🎙️ | IIT JEE Toppers & Parents Talk',
      topic: 'Mentorship & Toppers',
      videoCount: '3 Episodes',
      thumbnailUrl: 'https://i.ytimg.com/vi/iyH8aKeonAE/hqdefault.jpg',
      metaInfo: 'Topper Interviews • Hinglish',
      views: '12K+ Aspirants',
      description:
        'In-depth strategic conversations with JEE Advanced rankers and parents sharing preparation routines, revision schedules, and stress management at DK Academy.',
      focusAreas: ['Topper Strategies', 'Parent Discussions', 'Exam Psychology'],
      url: 'https://www.youtube.com/playlist?list=PLwVyDw_wgvbkWxgDm2miRSvPgEgUduaUO',
    },
    {
      title: 'Definite Integration – IIT JEE Important Questions Playlist | DK Sir',
      topic: 'Integral Calculus',
      videoCount: '48 Videos',
      thumbnailUrl: 'https://i.ytimg.com/vi/P2recqYxA1k/hqdefault.jpg',
      metaInfo: '48 Lectures • Hinglish',
      views: '54K+ Aspirants',
      description:
        'Master King\'s property, Queen\'s property, Leibniz rule for differentiating integrals, and bounded area calculations between complex functions with zero error.',
      focusAreas: ['King\'s Property', 'Leibniz Differentiation', 'Bounded Area'],
      url: 'https://www.youtube.com/playlist?list=PLwVyDw_wgvbnQANy7JV_13EM9CmnUf-EQ',
    },
    {
      title: 'Indefinite Integration PYQs | JEE Mains & Advanced by DK Sir',
      topic: 'Calculus Flagship',
      videoCount: '35 Videos',
      thumbnailUrl: 'https://i.ytimg.com/vi/JeYSYI7cXlQ/hqdefault.jpg',
      metaInfo: '35 Lectures • Hinglish',
      views: '41K+ Aspirants',
      description:
        'Step-by-step problem breakdowns of previous 15-year questions covering algebraic substitutions, trigonometric transforms, and bypass standard integrals.',
      focusAreas: ['Substitution Traps', 'By-Parts Shortcuts', 'Trig Transforms'],
      url: 'https://www.youtube.com/playlist?list=PLwVyDw_wgvbns_F8B1uC4uo8wquyHaIyN',
    },
    {
      title: 'Straight Line Theory Full Chapter | IIT JEE Maths by DK Sir',
      topic: 'Coordinate Geometry',
      videoCount: '28 Videos',
      thumbnailUrl: 'https://i.ytimg.com/vi/ORfSH-P0UXE/hqdefault.jpg',
      metaInfo: '28 Lectures • Hinglish',
      views: '36K+ Aspirants',
      description:
        'Foundational and advanced coordinate geometry exploring pair of straight lines, angle bisectors, parametric forms, and distance geometry fundamentals.',
      focusAreas: ['Pair of Lines', 'Parametric Forms', 'Distance Geometry'],
      url: 'https://www.youtube.com/playlist?list=PLwVyDw_wgvbmtf1kgwXH-v4bbFapViIbF',
    },
    {
      title: 'Matrices PYQ for IIT JEE (Mains + Advanced) | DK Sir',
      topic: 'Algebra & Matrices',
      videoCount: '24 Videos',
      thumbnailUrl: 'https://i.ytimg.com/vi/XD4x9Fe1xNk/hqdefault.jpg',
      metaInfo: '24 Lectures • Hinglish',
      views: '29K+ Aspirants',
      description:
        'Comprehensive PYQ solutions targeting adjoint properties, determinants, invertible matrices, and system of linear equations consistency criteria.',
      focusAreas: ['Adjoint Properties', 'Cramer\'s Rule', 'System of Equations'],
      url: 'https://www.youtube.com/playlist?list=PLwVyDw_wgvbmoWRsknvZT_Jfpjvsw6QG9',
    },
    {
      title: 'Differential Equations Concepts & Tricks | JEE Main + Advanced',
      topic: 'Applied Calculus',
      videoCount: '38 Videos',
      thumbnailUrl: 'https://i.ytimg.com/vi/9JwHNxWiHfg/hqdefault.jpg',
      metaInfo: '38 Lectures • Hinglish',
      views: '38K+ Aspirants',
      description:
        'Specialized subset combining foundational order/degree analysis with high-speed integrating factor shortcuts and orthogonal trajectory problem solving.',
      focusAreas: ['Linear Equations', 'Exact Forms', 'Integrating Factors'],
      url: 'https://www.youtube.com/playlist?list=PLwVyDw_wgvbmyYl5MsNoWd_IYzqQOeq55',
    },
  ];

  return (
    <section className={styles.playlistsSection}>
      <Container>
        <div className={styles.sectionHeader}>
          <div className={styles.headerTop}>
            <span className={styles.subheading}>YouTube Learning Repository</span>
            <a
              href="https://www.youtube.com/@DKAcademyJEE/playlists"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.channelLink}
            >
              <YoutubeIcon size={17} className={styles.ytIcon} />
              <span>Explore All 760+ Free Lectures on YouTube</span>
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          </div>
          <h2 className={styles.heading}>Major Chapter-Wise YouTube Playlists</h2>
          <p className={styles.caption}>
            Our digital library is systematically broken down into structured mathematical modules to help students revise chapter by chapter with high visual clarity.
          </p>
        </div>

        <div className={styles.playlistsGrid}>
          {playlists.map((pl, idx) => (
            <div key={idx} className={styles.playlistCard}>
              {/* 16:9 Video / Playlist Preview Thumbnail */}
              <a
                href={pl.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.thumbnailFrame}
                aria-label={`Watch ${pl.title} playlist on YouTube`}
              >
                <div className={styles.thumbnailBg}>
                  {/* Real YouTube Video Thumbnail */}
                  <img
                    src={pl.thumbnailUrl}
                    alt={pl.title}
                    className={styles.thumbnailImg}
                    loading="lazy"
                    onError={(e) => {
                      // Fallback if image fails
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className={styles.thumbnailOverlay} />

                  {/* Top Badges */}
                  <div className={styles.thumbnailTopRow}>
                    <span className={styles.thumbTopicTag}>{pl.topic}</span>
                    <span className={styles.videoCountPill}>{pl.videoCount} • Free</span>
                  </div>

                  {/* Centered YouTube Play Button Overlay */}
                  <div className={styles.playOverlay}>
                    <div className={styles.playBtnCircle}>
                      <Play size={20} className={styles.playBtnIcon} fill="currentColor" />
                    </div>
                  </div>

                  {/* Bottom Strip */}
                  <div className={styles.thumbnailBottomRow}>
                    <span className={styles.qualityTag}>1080p Full HD</span>
                    <span className={styles.dkWatermark}>DK Academy JEE</span>
                  </div>
                </div>
              </a>

              {/* Card Body & Details */}
              <div className={styles.cardBody}>
                <div className={styles.metaRow}>
                  <span className={styles.metaText}>{pl.metaInfo}</span>
                  <div className={styles.viewsBadge}>
                    <Users size={12} aria-hidden="true" />
                    <span>{pl.views}</span>
                  </div>
                </div>

                <h3 className={styles.playlistTitle} title={pl.title}>
                  {pl.title}
                </h3>

                <p className={styles.playlistDesc}>{pl.description}</p>

                {/* Focus Areas */}
                <div className={styles.focusPillsRow}>
                  {pl.focusAreas.map((focus, fIdx) => (
                    <span key={fIdx} className={styles.focusPill}>
                      {focus}
                    </span>
                  ))}
                </div>

                {/* Red Accent YouTube CTA Button */}
                <div className={styles.cardFooter}>
                  <a
                    href={pl.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.youtubeCtaBtn}
                  >
                    <YoutubeIcon size={16} className={styles.btnYtIcon} />
                    <span>Watch Playlist on YouTube</span>
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default AboutPlaylists;

