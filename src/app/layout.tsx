import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
