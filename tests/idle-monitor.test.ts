import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createIdleMonitor, IdleMonitor } from '@/lib/idle-monitor';

describe('IdleMonitor', () => {
  let monitor: IdleMonitor;
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    monitor = createIdleMonitor();
  });

  afterEach(() => {
    monitor.stop();
    vi.useRealTimers();
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  describe('start()', () => {
    it('should register listeners for pointermove, keydown, touchstart', () => {
      const onIdle = vi.fn();
      monitor.start(60_000, onIdle);

      expect(addEventListenerSpy).toHaveBeenCalledWith('pointermove', expect.any(Function), {
        passive: true,
      });
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function), {
        passive: true,
      });
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function), {
        passive: true,
      });
    });

    it('should not register duplicate listeners if called multiple times', () => {
      const onIdle = vi.fn();
      monitor.start(60_000, onIdle);
      monitor.start(60_000, onIdle);

      // Each event type should only be registered once
      const pointermoveCalls = addEventListenerSpy.mock.calls.filter(
        ([event]: [string, ...unknown[]]) => event === 'pointermove'
      );
      expect(pointermoveCalls).toHaveLength(1);
    });
  });

  describe('timer fires onIdle', () => {
    it('should fire onIdle callback after timeout', () => {
      const onIdle = vi.fn();
      monitor.start(5_000, onIdle);

      expect(onIdle).not.toHaveBeenCalled();

      vi.advanceTimersByTime(5_000);

      expect(onIdle).toHaveBeenCalledTimes(1);
    });

    it('should not fire onIdle before timeout', () => {
      const onIdle = vi.fn();
      monitor.start(10_000, onIdle);

      vi.advanceTimersByTime(9_999);
      expect(onIdle).not.toHaveBeenCalled();
    });
  });

  describe('activity resets timer', () => {
    it('should reset timer on pointermove event', () => {
      const onIdle = vi.fn();
      monitor.start(5_000, onIdle);

      // Advance 4s then simulate activity
      vi.advanceTimersByTime(4_000);
      document.dispatchEvent(new Event('pointermove'));

      // Advance another 4s — should not have fired since we reset at 4s
      vi.advanceTimersByTime(4_000);
      expect(onIdle).not.toHaveBeenCalled();

      // Advance remaining 1s to complete the new 5s cycle
      vi.advanceTimersByTime(1_000);
      expect(onIdle).toHaveBeenCalledTimes(1);
    });

    it('should reset timer on keydown event', () => {
      const onIdle = vi.fn();
      monitor.start(5_000, onIdle);

      vi.advanceTimersByTime(4_000);
      document.dispatchEvent(new Event('keydown'));

      vi.advanceTimersByTime(4_999);
      expect(onIdle).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(onIdle).toHaveBeenCalledTimes(1);
    });

    it('should reset timer on touchstart event', () => {
      const onIdle = vi.fn();
      monitor.start(5_000, onIdle);

      vi.advanceTimersByTime(4_000);
      document.dispatchEvent(new Event('touchstart'));

      vi.advanceTimersByTime(4_999);
      expect(onIdle).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(onIdle).toHaveBeenCalledTimes(1);
    });
  });

  describe('stop()', () => {
    it('should remove all event listeners', () => {
      const onIdle = vi.fn();
      monitor.start(5_000, onIdle);

      monitor.stop();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('pointermove', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
    });

    it('should clear the timer so onIdle does not fire', () => {
      const onIdle = vi.fn();
      monitor.start(5_000, onIdle);

      monitor.stop();
      vi.advanceTimersByTime(10_000);

      expect(onIdle).not.toHaveBeenCalled();
    });

    it('should be safe to call multiple times', () => {
      const onIdle = vi.fn();
      monitor.start(5_000, onIdle);

      expect(() => {
        monitor.stop();
        monitor.stop();
        monitor.stop();
      }).not.toThrow();
    });
  });

  describe('setTimeout()', () => {
    it('should update the timeout value and reset the timer', () => {
      const onIdle = vi.fn();
      monitor.start(10_000, onIdle);

      // Change timeout to 3s
      monitor.setTimeout(3_000);

      vi.advanceTimersByTime(3_000);
      expect(onIdle).toHaveBeenCalledTimes(1);
    });

    it('should not fire with old timeout after update', () => {
      const onIdle = vi.fn();
      monitor.start(5_000, onIdle);

      // Advance 3s, then change timeout to 10s
      vi.advanceTimersByTime(3_000);
      monitor.setTimeout(10_000);

      // At 5s original would have fired, but now it shouldn't
      vi.advanceTimersByTime(2_000);
      expect(onIdle).not.toHaveBeenCalled();

      // At 13s total (3s + 10s), it fires
      vi.advanceTimersByTime(8_000);
      expect(onIdle).toHaveBeenCalledTimes(1);
    });
  });

  describe('reset()', () => {
    it('should restart the timer with same timeout', () => {
      const onIdle = vi.fn();
      monitor.start(5_000, onIdle);

      // Advance 4s then reset
      vi.advanceTimersByTime(4_000);
      monitor.reset();

      // Advance another 4s — should not have fired
      vi.advanceTimersByTime(4_000);
      expect(onIdle).not.toHaveBeenCalled();

      // Advance final 1s
      vi.advanceTimersByTime(1_000);
      expect(onIdle).toHaveBeenCalledTimes(1);
    });
  });
});
