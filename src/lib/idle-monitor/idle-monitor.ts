/**
 * Idle Monitor
 *
 * Listens for user activity (pointer, keyboard, touch) and fires
 * a callback when the user has been idle for a specified duration.
 */

export interface IdleMonitor {
  start(timeoutMs: number, onIdle: () => void): void;
  reset(): void;
  stop(): void;
  setTimeout(timeoutMs: number): void;
}

const ACTIVITY_EVENTS = ['pointermove', 'keydown', 'touchstart'] as const;

export function createIdleMonitor(): IdleMonitor {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let timeoutMs = 0;
  let onIdle: (() => void) | null = null;
  let listening = false;

  function handleActivity(): void {
    resetTimer();
  }

  function resetTimer(): void {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    if (onIdle && timeoutMs > 0) {
      timer = globalThis.setTimeout(() => {
        if (onIdle) {
          onIdle();
        }
      }, timeoutMs);
    }
  }

  function addListeners(): void {
    if (listening) return;
    for (const event of ACTIVITY_EVENTS) {
      document.addEventListener(event, handleActivity, { passive: true });
    }
    listening = true;
  }

  function removeListeners(): void {
    if (!listening) return;
    for (const event of ACTIVITY_EVENTS) {
      document.removeEventListener(event, handleActivity);
    }
    listening = false;
  }

  function start(timeout: number, callback: () => void): void {
    timeoutMs = timeout;
    onIdle = callback;
    addListeners();
    resetTimer();
  }

  function reset(): void {
    resetTimer();
  }

  function stop(): void {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    removeListeners();
    onIdle = null;
  }

  function setTimeoutMs(newTimeout: number): void {
    timeoutMs = newTimeout;
    resetTimer();
  }

  return {
    start,
    reset,
    stop,
    setTimeout: setTimeoutMs,
  };
}
