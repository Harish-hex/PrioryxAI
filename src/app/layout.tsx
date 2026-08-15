import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "PrioryxAI",
  description: "Your academic and career command center",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
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
        <CookieBanner />
      </body>
    </html>
  );
}
