import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Providers } from '@/components/providers';
import './globals.css';

const geistSans = localFont({
  src: '../fonts/GeistVF.woff2',
  variable: '--font-geist-sans',
  display: 'swap',
});

const geistMono = localFont({
  src: '../fonts/GeistMonoVF.woff2',
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Quflun — Password Manager',
  description:
    'A privacy-first, offline-first password manager. No accounts, no telemetry, no network requests.',
  applicationName: 'Quflun',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Quflun Password Manager',
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
      className={`${geistSans.variable} ${geistMono.variable} h-full overflow-x-clip antialiased`}
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
          Content-Security-Policy is enforced via HTTP headers (vercel.json / _headers file),
          NOT via a meta tag. This avoids the chicken-and-egg problem where:
          1. Next.js generates inline scripts during build
          2. A post-build step must hash them and inject into the CSP
          3. But the CSP is inside the HTML that Next.js generated (circular)
          
          The _headers file and vercel.json provide CSP at the hosting level,
          which is the standard approach for static exports.
        */}
      </head>
      <body className="bg-background text-foreground flex min-h-full flex-col overflow-x-clip">
        <main className="flex flex-1 flex-col">
          <Providers>{children}</Providers>
        </main>
      </body>
    </html>
  );
}
