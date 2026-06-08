/**
 * Clipboard Manager
 *
 * Manages clipboard operations with automatic timed clearing.
 * Tracks ownership of clipboard content to avoid clearing external writes.
 */

export interface ClipboardManager {
  copy(value: string, timeoutMs?: number): Promise<void>;
  clearIfOwned(): Promise<void>;
  destroy(): void;
}

const DEFAULT_TIMEOUT_MS = 30_000;

export function createClipboardManager(): ClipboardManager {
  let lastWrittenValue: string | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let generation = 0;
  let canReadClipboard: boolean | null = null;

  async function detectReadCapability(): Promise<boolean> {
    try {
      await navigator.clipboard.readText();
      return true;
    } catch {
      return false;
    }
  }

  function cancelTimer(): void {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  async function copy(value: string, timeoutMs?: number): Promise<void> {
    cancelTimer();

    await navigator.clipboard.writeText(value);
    lastWrittenValue = value;
    generation++;

    // Detect read capability on first copy
    if (canReadClipboard === null) {
      canReadClipboard = await detectReadCapability();
    }

    const capturedGeneration = generation;
    const timeout = timeoutMs ?? DEFAULT_TIMEOUT_MS;

    timer = setTimeout(() => {
      // Only clear if no newer copy has superseded this one
      if (generation === capturedGeneration) {
        clearIfOwned();
      }
    }, timeout);
  }

  async function clearIfOwned(): Promise<void> {
    cancelTimer();

    if (canReadClipboard) {
      try {
        const current = await navigator.clipboard.readText();
        if (current === lastWrittenValue) {
          await navigator.clipboard.writeText('');
        }
        // If content differs, an external app changed it — do nothing
      } catch {
        // Permission denied or other read error — fallback to unconditional clear
        await navigator.clipboard.writeText('');
      }
    } else {
      // Cannot read clipboard (Firefox/Safari) — unconditional clear
      await navigator.clipboard.writeText('');
    }

    lastWrittenValue = null;
  }

  function destroy(): void {
    cancelTimer();
    lastWrittenValue = null;
    timer = null;
  }

  return { copy, clearIfOwned, destroy };
}
