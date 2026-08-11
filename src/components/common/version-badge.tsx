/**
 * Displays app version from build-time environment variable.
 */
export function VersionBadge() {
  return (
    <p className="text-muted-foreground text-center text-xs">
      Private by design • v{process.env.NEXT_PUBLIC_APP_VERSION}
    </p>
  );
}
