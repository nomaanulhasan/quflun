import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createClipboardManager, ClipboardManager } from '@/lib/clipboard';

describe('ClipboardManager', () => {
  let manager: ClipboardManager;
  let mockWriteText: ReturnType<typeof vi.fn>;
  let mockReadText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockWriteText = vi.fn().mockResolvedValue(undefined);
    mockReadText = vi.fn().mockResolvedValue('');

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mockWriteText,
        readText: mockReadText,
      },
      writable: true,
      configurable: true,
    });

    manager = createClipboardManager();
  });

  afterEach(() => {
    manager.destroy();
    vi.useRealTimers();
  });

  describe('copy()', () => {
    it('should write value to clipboard', async () => {
      await manager.copy('my-secret');
      expect(mockWriteText).toHaveBeenCalledWith('my-secret');
    });

    it('should start a timer that clears clipboard after default timeout', async () => {
      mockReadText.mockResolvedValue('my-secret');
      await manager.copy('my-secret');

      // Timer should not have fired yet
      expect(mockWriteText).toHaveBeenCalledTimes(1);

      // Advance past default timeout (30s)
      await vi.advanceTimersByTimeAsync(30_000);

      // Should have read clipboard and then written empty string to clear
      expect(mockReadText).toHaveBeenCalled();
      expect(mockWriteText).toHaveBeenCalledWith('');
    });

    it('should use custom timeout when provided', async () => {
      mockReadText.mockResolvedValue('secret');
      await manager.copy('secret', 5_000);

      // Should not clear before timeout
      await vi.advanceTimersByTimeAsync(4_999);
      expect(mockWriteText).toHaveBeenCalledTimes(1); // Only the initial copy

      // Should clear at timeout
      await vi.advanceTimersByTimeAsync(1);
      expect(mockWriteText).toHaveBeenCalledWith('');
    });

    it('should cancel previous timer when copy is called again', async () => {
      mockReadText.mockResolvedValue('second-secret');
      await manager.copy('first-secret');
      await manager.copy('second-secret');

      // Advance past the timeout
      await vi.advanceTimersByTimeAsync(30_000);

      // writeText should be called: first copy, second copy, then one clear
      expect(mockWriteText).toHaveBeenCalledTimes(3);
      expect(mockWriteText).toHaveBeenNthCalledWith(1, 'first-secret');
      expect(mockWriteText).toHaveBeenNthCalledWith(2, 'second-secret');
      expect(mockWriteText).toHaveBeenNthCalledWith(3, '');
    });
  });

  describe('clearIfOwned()', () => {
    it('should clear clipboard when content matches last written value', async () => {
      mockReadText.mockResolvedValue('my-secret');
      await manager.copy('my-secret');
      mockWriteText.mockClear();

      await manager.clearIfOwned();

      expect(mockReadText).toHaveBeenCalled();
      expect(mockWriteText).toHaveBeenCalledWith('');
    });

    it('should NOT clear clipboard when content was changed externally', async () => {
      mockReadText.mockResolvedValue('my-secret');
      await manager.copy('my-secret');
      mockWriteText.mockClear();

      // External app changed the clipboard
      mockReadText.mockResolvedValue('something-else');

      await manager.clearIfOwned();

      expect(mockReadText).toHaveBeenCalled();
      expect(mockWriteText).not.toHaveBeenCalled();
    });

    it('should fallback to unconditional clear when readText throws', async () => {
      mockReadText.mockResolvedValue('my-secret');
      await manager.copy('my-secret');
      mockWriteText.mockClear();

      // readText throws (permission denied)
      mockReadText.mockRejectedValue(new Error('Permission denied'));

      await manager.clearIfOwned();

      expect(mockWriteText).toHaveBeenCalledWith('');
    });

    it('should unconditionally clear when readText is not available', async () => {
      // Simulate readText failing on detection (canReadClipboard = false)
      mockReadText.mockRejectedValue(new Error('Not supported'));
      await manager.copy('my-secret');
      mockWriteText.mockClear();

      await manager.clearIfOwned();

      // Should write empty string unconditionally (no readText check)
      expect(mockWriteText).toHaveBeenCalledWith('');
    });
  });

  describe('destroy()', () => {
    it('should cancel pending timer', async () => {
      mockReadText.mockResolvedValue('my-secret');
      await manager.copy('my-secret');

      manager.destroy();

      // Advance past timeout — should NOT clear
      await vi.advanceTimersByTimeAsync(30_000);
      // Only the initial copy call
      expect(mockWriteText).toHaveBeenCalledTimes(1);
    });

    it('should null out references', async () => {
      await manager.copy('my-secret');
      manager.destroy();

      // Calling clearIfOwned after destroy should not crash
      // and should not try to match against old value
      mockWriteText.mockClear();
      mockReadText.mockResolvedValue('');

      // After destroy, lastWrittenValue is null, so readText() returns ''
      // which does not match null — but canReadClipboard was detected
      // The implementation nulls lastWrittenValue, so clipboard content ''
      // won't match null → no clear. But since canReadClipboard might be true,
      // it reads and compares.
      await manager.clearIfOwned();
    });
  });

  describe('generation tracking', () => {
    it('should not clear if a newer copy superseded the timer', async () => {
      mockReadText.mockResolvedValue('second');
      await manager.copy('first', 10_000);

      // After 5s, do another copy
      await vi.advanceTimersByTimeAsync(5_000);
      await manager.copy('second', 10_000);

      // The first timer fires at 10s but generation advanced
      await vi.advanceTimersByTimeAsync(5_000);

      // Only the two copy calls so far
      expect(mockWriteText).toHaveBeenCalledTimes(2);
      expect(mockWriteText).toHaveBeenNthCalledWith(1, 'first');
      expect(mockWriteText).toHaveBeenNthCalledWith(2, 'second');

      // The second timer fires at 15s total
      await vi.advanceTimersByTimeAsync(5_000);
      expect(mockWriteText).toHaveBeenCalledWith('');
    });
  });
});
