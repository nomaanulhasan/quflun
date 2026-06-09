/**
 * Displays app version from build-time environment variable.
 */
export function VersionBadge() {
  return (
    <p className="text-center text-xs text-muted-foreground/60">
      Private by design • v{process.env.NEXT_PUBLIC_APP_VERSION}
    </p>
  );
}
