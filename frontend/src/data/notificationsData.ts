import type { AppNotification } from '../types';

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_1',
    title: 'DK Sir Live JEE Advanced Speed Math Masterclass Scheduled',
    message: 'Join DK Sir on Sat, 24 Oct, 6:00 PM for a high-intensity 90-minute live session on solving definite integration and differential equations in 20–30 seconds.',
    category: 'announcement',
    tag: 'Live Masterclass',
    timestamp: Date.now() - 1000 * 60 * 35, // 35 mins ago
    read: false,
    urgency: 'high',
    linkText: 'Register for Live Class',
    linkUrl: '/classroom'
  },
  {
    id: 'notif_2',
    title: 'Daily DPP Set #42 is Now Live',
    message: '15 curated questions on Application of Derivatives (Tangents, Normals & Maxima-Minima) are ready for your daily speed & accuracy practice.',
    category: 'practice_test',
    tag: 'Daily DPP',
    timestamp: Date.now() - 1000 * 60 * 140, // 2.3 hours ago
    read: false,
    urgency: 'high',
    linkText: 'Start Daily Practice',
    linkUrl: '/dpp'
  },
  {
    id: 'notif_3',
    title: 'Ultimate 2-Year Batch: Chapter 14 Formula Handout Uploaded',
    message: 'Vector Algebra & 3D Geometry compendium with 25 shortcut derivations and NTA key tips has been added to your course materials.',
    category: 'course',
    tag: 'Handout PDF',
    timestamp: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
    read: false,
    urgency: 'normal',
    linkText: 'Access Course Materials',
    linkUrl: '/courses/jee-main-advanced-2yr-ultimate'
  },
  {
    id: 'notif_4',
    title: 'All India CBT Mock Test #04 Registration Open',
    message: 'Simulate the exact NTA JEE Main environment on Sun, 25 Oct, 9:00 AM. 300 marks simulation with percentile forecasting and chapter-wise negative mark breakdown.',
    category: 'practice_test',
    tag: 'CBT Mock Test',
    timestamp: Date.now() - 1000 * 60 * 60 * 19, // 19 hours ago
    read: false,
    urgency: 'high',
    linkText: 'Register for Test',
    linkUrl: '/test-series'
  },
  {
    id: 'notif_5',
    title: 'Offline Doubt Counters Active at Janakpuri Center',
    message: 'Dedicated one-on-one Mathematics and Physics doubt counters are operational Monday through Saturday (10:00 AM to 07:00 PM) at C4F/33 Janakpuri.',
    category: 'announcement',
    tag: 'Center Update',
    timestamp: Date.now() - 1000 * 60 * 60 * 28, // 28 hours ago
    read: true,
    urgency: 'normal',
    linkText: 'Janakpuri Center Location',
    linkUrl: '/about'
  },
  {
    id: 'notif_6',
    title: 'Class 12th Math Special: Indefinite Integration Video Solutions',
    message: 'Step-by-step video solutions and DK Sir alternative shortcut methods for the Indefinite Integrals chapter test have been published.',
    category: 'course',
    tag: 'Video Solutions',
    timestamp: Date.now() - 1000 * 60 * 60 * 48, // 2 days ago
    read: true,
    urgency: 'normal',
    linkText: 'Watch Solutions',
    linkUrl: '/courses'
  },
  {
    id: 'notif_7',
    title: 'PYQ Archive Updated: 2024 Session 2 Questions Added',
    message: 'Official past questions for Mathematics with NTA official answer keys and step-by-step verified explanations are now live in the archive.',
    category: 'practice_test',
    tag: 'PYQ Archive',
    timestamp: Date.now() - 1000 * 60 * 60 * 76, // 3 days ago
    read: true,
    urgency: 'low',
    linkText: 'Browse PYQ Questions',
    linkUrl: '/pyq'
  }
];
