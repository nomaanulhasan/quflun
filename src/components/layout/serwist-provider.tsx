'use client';

import { useEffect, useState, useCallback } from 'react';
import { Download } from 'lucide-react';

type SWStatus = 'idle' | 'registered' | 'failed';

// The BeforeInstallPromptEvent is not in the standard lib — extend Window here.
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

/**
 * SerwistProvider handles service worker registration, failure banners,
 * update notifications, and the PWA install prompt for the app.
 *
 * - Registers the service worker on mount (production only)
 * - Captures the browser's `beforeinstallprompt` event and surfaces an
 *   "Install app" button so the user can install the PWA
 * - Shows a warning banner if SW registration fails (app still works online)
 * - Shows an update notification when a new version is available
 */
export function SerwistProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SWStatus>('idle');
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // ─── Install Prompt Capture ──────────────────────────────────────────────────

  useEffect(() => {
    // Hide the install button if already running as a standalone PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    function onBeforeInstallPrompt(e: BeforeInstallPromptEvent) {
      // Prevent the browser's mini-infobar from appearing automatically
      e.preventDefault();
      setInstallPrompt(e);
    }

    function onAppInstalled() {
      // User installed via our button or the browser's own UI
      setInstallPrompt(null);
      setIsInstalled(true);
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  }, [installPrompt]);

  const dismissInstall = useCallback(() => {
    setInstallPrompt(null);
  }, []);

  // ─── Service Worker Registration ─────────────────────────────────────────────

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      setStatus('failed');
      return;
    }

    // Don't register the service worker in development — the precache manifest
    // references production build chunks that don't exist in dev mode.
    if (process.env.NODE_ENV !== 'production') {
      // Unregister any stale SW from a previous production build
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister();
        }
      });
      return;
    }

    let registration: ServiceWorkerRegistration | null = null;

    async function registerSW() {
      try {
        registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        setStatus('registered');

        // Check for updates on registration
        registration.addEventListener('updatefound', () => {
          const newWorker = registration?.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version installed but waiting to activate
              setUpdateAvailable(true);
              setWaitingWorker(newWorker);
            }
          });
        });

        // Handle the case where a waiting worker already exists
        if (registration.waiting && navigator.serviceWorker.controller) {
          setUpdateAvailable(true);
          setWaitingWorker(registration.waiting);
        }
      } catch (error) {
        console.warn('[SW] Registration failed:', error);
        setStatus('failed');
      }
    }

    registerSW();

    // Check for updates once on app open (after a short delay to not block initial load)
    const updateTimer = setTimeout(() => {
      if (registration && navigator.onLine) {
        registration.update().catch(() => {
          /* ignore network errors */
        });
      }
    }, 3000);

    // Listen for controller change (new SW activated)
    function onControllerChange() {
      window.location.reload();
    }

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    return () => {
      clearTimeout(updateTimer);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  // ─── Update Handlers ──────────────────────────────────────────────────────────

  const activateUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setUpdateAvailable(false);
      setWaitingWorker(null);
    }
  }, [waitingWorker]);

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  const dismissFailure = useCallback(() => {
    setStatus('idle');
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {children}

      {/* PWA Install Banner */}
      {installPrompt && !isInstalled && (
        <div
          role="banner"
          aria-label="Install app"
          className="fixed right-0 bottom-0 left-0 z-50 flex items-center justify-between gap-3 border-t border-border bg-card px-4 py-3 text-sm text-card-foreground shadow-lg"
        >
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>Install Quflun for offline access and a native app experience.</span>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={dismissInstall}
              className="rounded px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              aria-label="Dismiss install prompt"
            >
              Not now
            </button>
            <button
              onClick={handleInstall}
              className="rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              Install
            </button>
          </div>
        </div>
      )}

      {/* SW Registration Failure Banner */}
      {status === 'failed' && (
        <div
          role="alert"
          aria-live="polite"
          className="fixed right-0 bottom-0 left-0 z-50 flex items-center justify-between gap-3 border-t border-yellow-500/30 bg-yellow-50 px-4 py-3 text-sm text-yellow-900 dark:border-yellow-500/20 dark:bg-yellow-950/80 dark:text-yellow-100"
        >
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 shrink-0"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1ZM7 5a1 1 0 1 1 2 0v3a1 1 0 0 1-2 0V5Zm1 6.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
            </svg>
            <span>Offline mode is unavailable. The app will continue to work while online.</span>
          </div>
          <button
            onClick={dismissFailure}
            className="shrink-0 rounded px-2 py-1 text-xs font-medium hover:bg-yellow-200/50 dark:hover:bg-yellow-800/50"
            aria-label="Dismiss warning"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Update Available Notification */}
      {updateAvailable && (
        <div
          role="alert"
          aria-live="polite"
          className="fixed right-0 bottom-0 left-0 z-50 flex items-center justify-between gap-3 border-t border-blue-500/30 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-500/20 dark:bg-blue-950/80 dark:text-blue-100"
        >
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 shrink-0"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm-.75 3.75a.75.75 0 0 1 1.5 0v4.5a.75.75 0 0 1-1.5 0v-4.5ZM8 12a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
            </svg>
            <span>A new version is available.</span>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={dismissUpdate}
              className="rounded px-2 py-1 text-xs font-medium hover:bg-blue-200/50 dark:hover:bg-blue-800/50"
            >
              Later
            </button>
            <button
              onClick={activateUpdate}
              className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              Update now
            </button>
          </div>
        </div>
      )}
    </>
  );
}
