'use client';

import { useEffect, useState, useCallback } from 'react';

type SWStatus = 'idle' | 'registered' | 'failed';

/**
 * SerwistProvider handles service worker registration, failure banners,
 * and update notifications for the PWA.
 *
 * - Registers the service worker on mount
 * - Shows a warning banner if SW registration fails (app still works online)
 * - Shows an update notification when a new version is available
 */
export function SerwistProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SWStatus>('idle');
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

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
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
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

    // Listen for controller change (new SW activated)
    function onControllerChange() {
      window.location.reload();
    }

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

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

  return (
    <>
      {children}

      {/* SW Registration Failure Banner */}
      {status === 'failed' && (
        <div
          role="alert"
          aria-live="polite"
          className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-3 border-t border-yellow-500/30 bg-yellow-50 px-4 py-3 text-sm text-yellow-900 dark:border-yellow-500/20 dark:bg-yellow-950/80 dark:text-yellow-100"
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
            <span>
              Offline mode is unavailable. The app will continue to work while online.
            </span>
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
          className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-3 border-t border-blue-500/30 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-500/20 dark:bg-blue-950/80 dark:text-blue-100"
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
