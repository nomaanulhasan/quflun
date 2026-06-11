import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "@/components/providers";
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
  title: "Quflun — Password Manager",
  description:
    "A privacy-first, offline-first password manager. No accounts, no telemetry, no network requests.",
  applicationName: "Quflun",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Quflun Password Manager",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased overflow-x-clip`}
      suppressHydrationWarning
    >
      <head>
        <meta name="referrer" content="no-referrer" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-title" content="Quflun" />
        {/*
          Next.js auto-generates favicon/icon/apple-icon links from:
          - src/app/favicon.ico
          - src/app/icon0.svg, src/app/icon1.png
          - src/app/apple-icon.png
        */}
        {/*
          Content-Security-Policy meta tag.
          The post-build script (scripts/extract-csp-hashes.mjs) computes
          SHA-256 hashes for inline scripts/styles and injects them below.
        */}
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-hashes'; img-src 'self'; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground overflow-x-clip">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
