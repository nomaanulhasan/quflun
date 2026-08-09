'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect from old /health-check route to merged /password-health page.
 */
export default function HealthCheckRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/password-health');
  }, [router]);

  return null;
}
