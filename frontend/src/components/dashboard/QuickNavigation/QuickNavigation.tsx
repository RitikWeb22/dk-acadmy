import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  FileText,
  HelpCircle,
  Award,
  Video,
  PlaySquare
} from 'lucide-react';
import styles from './QuickNavigation.module.scss';

export const QuickNavigation: React.FC = () => {
  const navItems = [
    { id: 'courses', label: 'My Courses', to: '/courses', icon: <BookOpen size={14} /> },
    { id: 'dpp', label: 'Daily DPP Practice', to: '/dpp', icon: <FileText size={14} /> },
    { id: 'pyq', label: 'PYQ Archive', to: '/pyq', icon: <HelpCircle size={14} /> },
    { id: 'test-series', label: 'CBT Mock Tests', to: '/test-series', icon: <Award size={14} /> },
    { id: 'free-lectures', label: 'Free Lectures', to: '/free-lectures', icon: <Video size={14} /> },
    { id: 'video-solutions', label: 'Video Solutions', to: '/free-lectures', icon: <PlaySquare size={14} /> }
  ];

  return (
    <nav className={styles.shortcutsNav} aria-label="Dashboard quick shortcuts">
      <span className={styles.shortcutsLabel}>Quick Jumps:</span>
      <div className={styles.shortcutsList}>
        {navItems.map((item) => (
          <Link key={item.id} to={item.to} className={styles.shortcutChip}>
            <span className={styles.chipIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};
