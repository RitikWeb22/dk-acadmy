/**
 * Centralized Real-time Admin Notifications Service
 * Synchronizes notifications from WebSocket events and backend database.
 */

import { apiClient } from './apiClient';
import { soundEffects } from '../utils/sound';

export interface AdminNotificationItem {
  id: string;
  title: string;
  description?: string;
  type: 'payment' | 'lead' | 'course' | 'student' | 'system' | 'test_series' | 'doubt' | 'review';
  time: string;
  timestamp: number;
  unread: boolean;
  meta?: any;
}

const STORAGE_KEY = 'dk_admin_notifications_v2';
export const NOTIFICATIONS_EVENT_KEY = 'dk_admin_notifications_updated';

const formatTimeAgo = (timestamp: number): string => {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
};

export const notificationService = {
  getNotifications(): AdminNotificationItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: AdminNotificationItem[] = JSON.parse(raw);
        // Exclude any misdirected 'Doubt Answered' from admin notifications
        return parsed
          .filter((n) => !n.title.toLowerCase().includes('doubt answered'))
          .map((n) => ({
            ...n,
            time: formatTimeAgo(n.timestamp || Date.now())
          }));
      }
    } catch {
      // fallback
    }
    return [];
  },

  saveNotifications(items: AdminNotificationItem[]): void {
    const cleaned = items.filter((n) => !n.title.toLowerCase().includes('doubt answered'));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned.slice(0, 50)));
    window.dispatchEvent(
      new CustomEvent(NOTIFICATIONS_EVENT_KEY, { detail: cleaned })
    );
  },

  addNotification(item: Omit<AdminNotificationItem, 'id' | 'time'>): AdminNotificationItem {
    // If somehow a Doubt Answered notification reaches here, ignore it for Admin
    if (item.title.toLowerCase().includes('doubt answered')) {
      return { ...item, id: '', time: '' } as AdminNotificationItem;
    }

    const list = this.getNotifications();
    const newItem: AdminNotificationItem = {
      ...item,
      id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      time: 'Just now'
    };

    const updated = [newItem, ...list.filter((n) => n.id !== newItem.id)].slice(0, 50);
    this.saveNotifications(updated);
    return newItem;
  },

  markAllAsRead(): void {
    const list = this.getNotifications().map((n) => ({ ...n, unread: false }));
    this.saveNotifications(list);
  },

  markAsRead(id: string): void {
    const list = this.getNotifications().map((n) => (n.id === id ? { ...n, unread: false } : n));
    this.saveNotifications(list);
  },

  clearAll(): void {
    this.saveNotifications([]);
  },

  getUnreadCount(): number {
    return this.getNotifications().filter((n) => n.unread).length;
  },

  /**
   * Fetch initial notifications from database if local cache is empty
   */
  async syncInitialNotifications(): Promise<void> {
    const existing = this.getNotifications();
    if (existing.length >= 3) return;

    try {
      // Fetch recent orders from MongoDB
      const ordersRes = await apiClient.get('/payment/orders?limit=5');
      const newItems: AdminNotificationItem[] = [];

      if (ordersRes.success && Array.isArray(ordersRes.data)) {
        ordersRes.data.forEach((o: any) => {
          const createdAt = new Date(o.createdAt).getTime();
          newItems.push({
            id: `notif_order_${o._id || o.orderId}`,
            title: `${o.studentName || 'Student'} paid ₹${(o.amount || 0).toLocaleString('en-IN')} for ${o.courseTitle || 'JEE Course'}`,
            type: 'payment',
            timestamp: createdAt,
            time: formatTimeAgo(createdAt),
            unread: true,
            meta: { ...o, route: '/admin/invoices' }
          });
        });
      }

      // Fetch recent leads
      const leadsRes = await apiClient.get('/leads?limit=3');
      if (leadsRes.success && Array.isArray(leadsRes.data)) {
        leadsRes.data.forEach((l: any) => {
          const createdAt = new Date(l.createdAt || Date.now()).getTime();
          newItems.push({
            id: `notif_lead_${l._id || l.leadId}`,
            title: `New Inquiry: ${l.fullName || 'Student'} (${l.targetCourse || l.targetExam || 'JEE'})`,
            type: 'lead',
            timestamp: createdAt,
            time: formatTimeAgo(createdAt),
            unread: true,
            meta: { ...l, route: '/admin/students' }
          });
        });
      }

      if (newItems.length > 0) {
        newItems.sort((a, b) => b.timestamp - a.timestamp);
        this.saveNotifications(newItems);
      }
    } catch (err) {
      console.warn('[notificationService] Failed to sync initial notifications:', err);
    }
  }
};
