import type { Metadata } from 'next';
import InstallAppView from '@/components/install/InstallAppView';

export const metadata: Metadata = {
  title: 'Install PrioryxAI App — Mobile & Desktop Command Center',
  description:
    'Install PrioryxAI on Android, iOS, Windows, Mac, or Linux. Enjoy 0-second launch, offline deadline tracking, urgent exam push notifications, and seamless academic priority feed.',
  openGraph: {
    title: 'Install PrioryxAI App — Mobile & Desktop Command Center',
    description:
      'Install PrioryxAI on Android, iOS, Windows, and Mac. Instant 0-second launch, offline semester priority feed, and exam alerts.',
    url: 'https://www.prioryxai.in/install',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Install PrioryxAI App',
      },
    ],
  },
};

export default function InstallPage() {
  return <InstallAppView />;
}
