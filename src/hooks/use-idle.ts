'use client';

import { useEffect, useRef } from 'react';
import type { IdleMonitor } from '@/lib/idle-monitor';

/**
 * useIdle — starts IdleMonitor and wires its onIdle callback to vault lock.
 *
 * Does not duplicate idle detection logic.
 * IdleMonitor handles event listeners and timer management.
 *
 * @param monitor - The IdleMonitor instance
 * @param timeoutMs - Idle timeout in milliseconds
 * @param onIdle - Callback fired when idle timeout expires (typically vault lock)
 * @param enabled - Whether to activate idle monitoring (false when vault is locked)
 */
export function useIdle(
  monitor: IdleMonitor,
  timeoutMs: number,
  onIdle: () => void,
  enabled = true
) {
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;

  useEffect(() => {
    if (!enabled || timeoutMs <= 0) {
      monitor.stop();
      return;
    }

    monitor.start(timeoutMs, () => {
      onIdleRef.current();
    });

    return () => {
      monitor.stop();
    };
  }, [monitor, timeoutMs, enabled]);

  // Update timeout if it changes while running
  useEffect(() => {
    if (enabled && timeoutMs > 0) {
      monitor.setTimeout(timeoutMs);
    }
  }, [monitor, timeoutMs, enabled]);
}
