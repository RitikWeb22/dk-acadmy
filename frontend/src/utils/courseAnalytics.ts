/**
 * Analytics Hooks & Event Dispatcher for DK Academy Course Listing
 * Emits custom DOM events and integrates with GTM / dataLayer if available.
 */

export type CourseAnalyticsEvent =
  | 'filter_applied'
  | 'sort_changed'
  | 'page_changed'
  | 'card_clicked'
  | 'enroll_clicked'
  | 'demo_clicked'
  | 'syllabus_opened'
  | 'callback_submitted'
  | 'compare_added'
  | 'compare_removed';

export interface AnalyticsPayload {
  courseId?: string;
  courseTitle?: string;
  position?: number;
  filterType?: string;
  filterValue?: string | number | boolean;
  sortBy?: string;
  page?: number;
  phone?: string;
  classLevel?: string;
  targetYear?: string;
  mode?: string;
  slot?: string;
  price?: number;
  source?: string;
  [key: string]: any;
}

export const trackCourseEvent = (
  eventName: CourseAnalyticsEvent,
  payload: AnalyticsPayload = {}
): void => {
  const eventData = {
    event: eventName,
    timestamp: new Date().toISOString(),
    ...payload
  };

  // 1. Dispatch custom DOM event for custom analytics listeners
  if (typeof window !== 'undefined') {
    try {
      const customEvent = new CustomEvent('dk_analytics_event', {
        detail: eventData
      });
      window.dispatchEvent(customEvent);

      // 2. Push to window.dataLayer if Google Tag Manager is present
      const win = window as any;
      if (Array.isArray(win.dataLayer)) {
        win.dataLayer.push(eventData);
      }
    } catch {
      // Gracefully silent in case CustomEvent fails
    }
  }

  // Debug log in development environment
  if (import.meta.env?.DEV) {
    // eslint-disable-next-line no-console
    console.debug(`[Analytics: ${eventName}]`, payload);
  }
};
