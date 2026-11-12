import { useState, useEffect } from 'react';

type ClockListener = (now: number) => void;
const listeners = new Set<ClockListener>();
let globalInterval: ReturnType<typeof setInterval> | null = null;
let currentNow = Date.now();

function startClock() {
  if (!globalInterval && typeof window !== 'undefined') {
    currentNow = Date.now();
    globalInterval = setInterval(() => {
      currentNow = Date.now();
      listeners.forEach((listener) => listener(currentNow));
    }, 1000);
  }
}

function stopClock() {
  if (globalInterval && listeners.size === 0) {
    clearInterval(globalInterval);
    globalInterval = null;
  }
}

/**
 * High-performance shared 1-second clock hook.
 * Replaces dozens of fragmented setInterval instances across cards and pages
 * with a single reference-counted global timer that runs only when subscribed.
 */
export function useSharedClock(enabled: boolean = true): number {
  const [now, setNow] = useState<number>(currentNow);

  useEffect(() => {
    if (!enabled) return;

    const listener: ClockListener = (timestamp) => {
      setNow(timestamp);
    };

    listeners.add(listener);
    startClock();

    return () => {
      listeners.delete(listener);
      stopClock();
    };
  }, [enabled]);

  return now;
}

