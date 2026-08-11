import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "PrioryxAI",
  description: "Your academic and career command center",
  openGraph: {
    type: "website",
    url: "https://www.prioryxai.in/",
    title: "PrioryxAI | Academic & Career Command Center",
    description: "Connect GitHub, upload your timetable, and let PrioryxAI rank your next high-leverage move.",
    siteName: "PrioryxAI",
  },
  twitter: {
    card: "summary_large_image",
    title: "PrioryxAI",
    description: "Connect GitHub, upload your timetable, and let PrioryxAI rank your next high-leverage move.",
  },
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
