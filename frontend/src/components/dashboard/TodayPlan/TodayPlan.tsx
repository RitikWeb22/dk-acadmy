import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  BookOpen,
  Clock,
  ArrowRight,
  CheckCircle2,
  Circle,
  Flame
} from 'lucide-react';
import styles from './TodayPlan.module.scss';

interface PlanTask {
  id: string;
  badge: string;
  badgeColor: 'dpp' | 'pyq' | 'drill';
  title: string;
  meta: string;
  route: string;
  actionText: string;
  icon: React.ReactNode;
}

export const TodayPlan: React.FC = () => {
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('dk_today_tasks_done');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const toggleTask = (taskId: string) => {
    setCompletedTaskIds((prev) => {
      const updated = prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId];
      try {
        localStorage.setItem('dk_today_tasks_done', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
  };

  const tasks: PlanTask[] = [
    {
      id: 'task-1-dpp',
      badge: 'DPP',
      badgeColor: 'dpp',
      title: 'Quadratic Equations & Complex Roots',
      meta: '10 Qs • 30 mins recommended',
      route: '/dpp',
      actionText: 'Solve DPP →',
      icon: <FileText size={16} aria-hidden="true" />
    },
    {
      id: 'task-2-pyq',
      badge: 'PYQ',
      badgeColor: 'pyq',
      title: 'Sequences & Series JEE Main PYQs',
      meta: '15 Qs • Previous 5 Years Archive',
      route: '/pyq',
      actionText: 'Practice PYQs →',
      icon: <BookOpen size={16} aria-hidden="true" />
    },
    {
      id: 'task-3-speed',
      badge: 'Speed Drill',
      badgeColor: 'drill',
      title: 'DK Sir 20-30s Speed Math CBT',
      meta: 'Class 11 Sprint Simulation',
      route: '/test-series',
      actionText: 'Start Test →',
      icon: <Clock size={16} aria-hidden="true" />
    }
  ];

  const completedCount = tasks.filter((t) => completedTaskIds.includes(t.id)).length;
  const isAllCompleted = completedCount === tasks.length;

  return (
    <section className={styles.card} aria-labelledby="today-plan-title">
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.titleWrap}>
            <h2 id="today-plan-title" className={styles.title}>
              Today's Plan
            </h2>
            <span
              className={`${styles.progressPill} ${
                isAllCompleted ? styles.progressPillCompleted : ''
              }`}
            >
              {completedCount}/{tasks.length} Completed
            </span>
          </div>
        </div>

        {/* Gamified Motivation Line */}
        <div className={styles.motivationRow}>
          <Flame size={14} className={styles.flameIcon} />
          <span className={styles.motivationText}>
            {isAllCompleted
              ? 'Awesome! You crushed all tasks today. 7-day streak maintained! 🚀'
              : 'Complete all 3 tasks to keep your 7-day study streak alive! 🔥'}
          </span>
        </div>
      </div>

      {/* Interactive Task Items */}
      <div className={styles.taskList} role="list" aria-label="Daily study tasks">
        {tasks.map((task) => {
          const isDone = completedTaskIds.includes(task.id);

          return (
            <div
              key={task.id}
              className={`${styles.taskItem} ${isDone ? styles.taskItemDone : ''}`}
              role="listitem"
            >
              {/* Rounded Interactive Checkbox */}
              <button
                type="button"
                className={styles.checkToggleBtn}
                onClick={() => toggleTask(task.id)}
                aria-label={
                  isDone
                    ? `Mark ${task.title} as incomplete`
                    : `Mark ${task.title} as completed`
                }
              >
                {isDone ? (
                  <CheckCircle2 size={22} className={styles.checkDoneIcon} />
                ) : (
                  <Circle size={22} className={styles.circlePendingIcon} />
                )}
              </button>

              {/* Task Details */}
              <div className={styles.taskContent}>
                <div className={styles.taskMetaTop}>
                  <span className={`${styles.badge} ${styles[task.badgeColor]}`}>
                    {task.badge}
                  </span>
                  <span className={styles.taskMetaText}>{task.meta}</span>
                </div>
                <h3 className={`${styles.taskTitle} ${isDone ? styles.taskTitleDone : ''}`}>
                  {task.title}
                </h3>
              </div>

              {/* Action Link */}
              <Link to={task.route} className={styles.actionLink}>
                <span>{task.actionText}</span>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default TodayPlan;
