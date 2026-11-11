/**
 * Cross-Tab Realtime Synchronization via BroadcastChannel
 * Ensures that when an admin publishes, creates, or edits a test in one tab,
 * all other open tabs (Student CBT Portal, Student Dashboard, Admin Workspace)
 * update immediately within milliseconds without requiring a page reload.
 */

const CHANNEL_NAME = 'dk_academy_realtime_channel';

let channel: BroadcastChannel | null = null;

try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch {
  // BroadcastChannel not available or restricted
}

export type RealtimeSyncEvent =
  | { type: 'test_series_created'; data: any }
  | { type: 'test_series_updated'; data: any }
  | { type: 'test_series_deleted'; id: string }
  | { type: 'course_updated'; data: any };

export const broadcastRealtimeEvent = (event: RealtimeSyncEvent): void => {
  if (channel) {
    try {
      channel.postMessage(event);
    } catch {}
  }
  // Also dispatch window custom event for current tab
  if (typeof window !== 'undefined') {
    if (event.type === 'test_series_created') {
      window.dispatchEvent(new CustomEvent('dk_test_series_created', { detail: event.data }));
    } else if (event.type === 'test_series_updated') {
      window.dispatchEvent(new CustomEvent('dk_test_series_updated', { detail: event.data }));
    } else if (event.type === 'test_series_deleted') {
      window.dispatchEvent(new CustomEvent('dk_test_series_deleted', { detail: event.id }));
    }
  }
};

export const subscribeRealtimeEvents = (
  callback: (event: RealtimeSyncEvent) => void
): (() => void) => {
  if (!channel) {
    return () => {};
  }
  const handler = (messageEvent: MessageEvent<RealtimeSyncEvent>) => {
    if (messageEvent?.data) {
      callback(messageEvent.data);
    }
  };
  channel.addEventListener('message', handler);
  return () => {
    channel?.removeEventListener('message', handler);
  };
};

