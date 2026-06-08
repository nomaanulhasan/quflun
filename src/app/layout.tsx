import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "../fonts/GeistVF.woff2",
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff2",
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Qufly — Password Manager",
  description:
    "A privacy-first, offline-first password manager. No accounts, no telemetry, no network requests.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta name="referrer" content="no-referrer" />
        {/*
          Content-Security-Policy meta tag placeholder.
          The post-build script (scripts/extract-csp-hashes.mjs) will compute
          SHA-256 hashes for inline scripts and inject them here.

          <meta
            httpEquiv="Content-Security-Policy"
            content="default-src 'none'; script-src 'self' 'wasm-unsafe-eval' 'sha256-HASH1' 'sha256-HASH2'; style-src 'self' 'unsafe-hashes' 'sha256-STYLE_HASH'; img-src 'self'; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
          />
        */}
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* Providers placeholder — wrap children with context providers here (e.g., ThemeProvider, Toaster) */}
        {children}
      </body>
    </html>
  );
}
