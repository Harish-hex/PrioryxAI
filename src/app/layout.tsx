import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { CookieBanner } from "@/components/cookie-banner";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";

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
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#070e1c" },
  ],
};

export const metadata: Metadata = {
  title: "PrioryxAI - Student Command OS",
  description: "Your academic and career command center with AI priority scoring, resume intelligence, and peer collab.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo-square.png",
    apple: "/logo-square.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PrioryxAI",
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
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <PwaInstallPrompt />
        <CookieBanner />
      </body>
    </html>
  );
}
