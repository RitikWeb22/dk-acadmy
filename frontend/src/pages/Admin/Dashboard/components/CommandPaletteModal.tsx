import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  LayoutDashboard,
  FolderKanban,
  BookOpen,
  Activity,
  Target,
  Users,
  ShieldCheck,
  Mail,
  CreditCard,
  Plus,
  ArrowRight,
  X,
  Monitor,
  Compass
} from 'lucide-react';
import styles from './CommandPaletteModal.module.scss';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (key: string, route?: string) => void;
  onQuickAction: (actionKey: string) => void;
}

interface CommandItem {
  id: string;
  category: 'Navigation' | 'Actions';
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  action: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onQuickAction
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commandItems: CommandItem[] = [
    {
      id: 'nav-dashboard',
      category: 'Navigation',
      label: 'Main Dashboard',
      sublabel: 'Executive telemetry, KPIs, live batches, and recent activity',
      icon: LayoutDashboard,
      action: () => onNavigate('dashboard', '/admin/dashboard')
    },
    {
      id: 'nav-batches',
      category: 'Navigation',
      label: 'Manage Batches',
      sublabel: 'Classroom saturation, rosters, and evening timings',
      icon: FolderKanban,
      action: () => onNavigate('batches')
    },
    {
      id: 'nav-students',
      category: 'Navigation',
      label: 'Student Management',
      sublabel: 'Student roster, attendance register, and batch allocation',
      icon: Users,
      action: () => onNavigate('students', '/admin/students')
    },
    {
      id: 'nav-teachers',
      category: 'Navigation',
      label: 'Teachers & Admin Staff',
      sublabel: 'Faculty assignments, RBAC credentials, and HOD permissions',
      icon: ShieldCheck,
      action: () => onNavigate('teachers', '/admin/teachers')
    },
    {
      id: 'nav-courses',
      category: 'Navigation',
      label: 'Build Courses',
      sublabel: 'Class 11/12/Dropper syllabus, video lessons, and pricing',
      icon: BookOpen,
      action: () => onNavigate('courses', '/admin/courses/create')
    },
    {
      id: 'nav-test-series',
      category: 'Navigation',
      label: 'Test Series CBT Engine',
      sublabel: 'NTA pattern mock tests, answer keys, and timing',
      icon: Activity,
      action: () => onNavigate('test-series')
    },
    {
      id: 'nav-dpp',
      category: 'Navigation',
      label: 'DPP, PYQ & BITSAT Drills',
      sublabel: 'Daily practice problem sets and 10-year question bank',
      icon: Target,
      action: () => onNavigate('dpp-pyq')
    },
    {
      id: 'nav-inquiries',
      category: 'Navigation',
      label: 'Admission Inquiries',
      sublabel: 'Callback requests, demo trials, and WhatsApp leads',
      icon: Mail,
      action: () => onNavigate('inquiries')
    },
    {
      id: 'nav-pages',
      category: 'Navigation',
      label: 'Page Management & Visual Builder',
      sublabel: 'Design custom educational landing pages, layouts, and rich sections',
      icon: Monitor,
      action: () => onNavigate('pages', '/admin/pages')
    },
    {
      id: 'nav-navbar-footer',
      category: 'Navigation',
      label: 'Navbar & Footer Management',
      sublabel: 'Manage header menus, dropdown hierarchies, and footer center info',
      icon: Compass,
      action: () => onNavigate('navbar-footer', '/admin/navbar-footer')
    },
    // Quick Actions
    {
      id: 'act-add-student',
      category: 'Actions',
      label: 'Add New Student',
      sublabel: 'Enroll student into Classroom Janakpuri or Online LMS',
      icon: Plus,
      action: () => onQuickAction('student')
    },
    {
      id: 'act-create-batch',
      category: 'Actions',
      label: 'Create Academic Batch',
      sublabel: 'Set seat capacity, classroom venue, and assigned faculty',
      icon: Plus,
      action: () => onQuickAction('batch')
    },
    {
      id: 'act-create-mock',
      category: 'Actions',
      label: 'Create CBT Mock Exam',
      sublabel: 'Schedule 3-hour NTA full syllabus examination',
      icon: Plus,
      action: () => onQuickAction('test')
    },
    {
      id: 'act-add-lead',
      category: 'Actions',
      label: 'Log Admission Lead',
      sublabel: 'Record incoming phone inquiry or demo request',
      icon: Plus,
      action: () => onQuickAction('lead')
    },
    {
      id: 'act-record-payment',
      category: 'Actions',
      label: 'Record Fee Payment',
      sublabel: 'Cash, UPI, or Razorpay installment verification',
      icon: CreditCard,
      action: () => onQuickAction('payment')
    }
  ];

  const filteredCommands = commandItems.filter(
    (item) =>
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.sublabel.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === 0 ? (filteredCommands.length - 1) : prev - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.paletteContainer} onClick={(e) => e.stopPropagation()}>
        {/* Search Input Bar */}
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            className={styles.paletteInput}
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close palette">
            <X size={16} />
          </button>
        </div>

        {/* Results List */}
        <div className={styles.resultsList}>
          {filteredCommands.length === 0 ? (
            <div className={styles.emptyState}>No matching commands found.</div>
          ) : (
            filteredCommands.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={item.id}
                  className={`${styles.commandRow} ${isSelected ? styles.selectedRow : ''}`}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className={styles.rowLeft}>
                    <div className={styles.rowIconBox}>
                      <Icon size={16} />
                    </div>
                    <div className={styles.rowTextCol}>
                      <span className={styles.rowLabel}>{item.label}</span>
                      <span className={styles.rowSublabel}>{item.sublabel}</span>
                    </div>
                  </div>

                  <div className={styles.rowRight}>
                    <span className={styles.categoryBadge}>{item.category}</span>
                    <ArrowRight size={13} className={styles.arrowIcon} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className={styles.paletteFooter}>
          <span>Use <strong>↑</strong> <strong>↓</strong> to navigate</span>
          <span><strong>↵</strong> to select</span>
          <span><strong>ESC</strong> to dismiss</span>
        </div>
      </div>
    </div>
  );
};
