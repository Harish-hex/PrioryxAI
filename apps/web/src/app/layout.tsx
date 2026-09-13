import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { CookieBanner } from "@/components/cookie-banner";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
  preload: true,
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#070e1c" },
  ],
};

export const metadata: Metadata = {
  title: 'PrioryxAI — AI Career Command Center for Engineering Students',
  description: 'Connect GitHub, upload your timetable, and let AI rank every exam, project, and internship deadline into one feed. Built for Indian engineering students.',
  keywords: [
    'placement preparation',
    'engineering students India',
    'AI study planner',
    'career guidance',
    'resume analysis',
    'LeetCode tracking',
    'GitHub portfolio',
    'internship matching',
    'B.Tech placement',
    'AI tools for students',
  ],
  authors: [{ name: 'PrioryxAI', url: 'https://prioryxai.in' }],
  creator: 'PrioryxAI',
  metadataBase: new URL('https://www.prioryxai.in'),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://www.prioryxai.in',
    title: 'PrioryxAI — AI Career Command Center for Engineering Students',
    description: 'AI-ranked priority feed for your semester. Resume intelligence. GitHub analysis. Job matching. Built for serious students.',
    siteName: 'PrioryxAI',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PrioryxAI — Your AI-powered student OS',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PrioryxAI — AI Career Command Center',
    description: 'AI-ranked priority feed for engineering students. Resume intelligence, GitHub analysis, job matching.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PrioryxAI',
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="https://api.github.com" />
        <link rel="dns-prefetch" href="https://api.openai.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://avatars.githubusercontent.com" />
        <link rel="preconnect" href="https://lh3.googleusercontent.com" />
        {/* Supabase is the single most-hit origin on every authenticated
            page (auth check + every API route's DB calls) — preconnecting
            it saves a DNS+TLS round trip on first contact. */}
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        )}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                // Suppress third-party browser extension errors (MetaMask, Phantom, etc.)
                if (typeof window !== 'undefined') {
                  window.addEventListener('error', function(e) {
                    var file = e.filename || '';
                    var msg = (e.message || '') + '';
                    if (file.indexOf('chrome-extension://') !== -1 || file.indexOf('moz-extension://') !== -1 || msg.indexOf('MetaMask') !== -1 || msg.indexOf('inpage.js') !== -1) {
                      e.stopImmediatePropagation();
                      e.preventDefault();
                      return true;
                    }
                  }, true);
                  window.addEventListener('unhandledrejection', function(e) {
                    var r = e.reason;
                    var rStr = (r && (r.stack || r.message || String(r))) || '';
                    if (rStr.indexOf('chrome-extension://') !== -1 || rStr.indexOf('MetaMask') !== -1 || rStr.indexOf('inpage.js') !== -1) {
                      e.stopImmediatePropagation();
                      e.preventDefault();
                    }
                  });
                }

                // Theme initialization
                var stored = localStorage.getItem('prioryx-theme');
                var mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                var isDark = stored ? stored === 'dark' : mediaQuery.matches;
                document.documentElement.classList.toggle('dark', !!isDark);
                document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
                function applyTheme(e) {
                  if (!localStorage.getItem('prioryx-theme')) {
                    var dark = e.matches !== undefined ? e.matches : e;
                    document.documentElement.classList.toggle('dark', !!dark);
                    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
                  }
                }
                if (mediaQuery.addEventListener) {
                  mediaQuery.addEventListener('change', applyTheme);
                } else if (mediaQuery.addListener) {
                  mediaQuery.addListener(applyTheme);
                }
              } catch (e) {}
            })();
          `
        }} />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
