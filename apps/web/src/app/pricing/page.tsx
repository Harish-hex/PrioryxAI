import type { Metadata } from 'next';
import PricingPageView from '@/components/pricing/PricingPageView';

export const metadata: Metadata = {
  title: 'Pricing — PrioryxAI Student & Campus Plans',
  description:
    'Simple, transparent pricing for Indian engineering students. Free starter tier and ₹59/month Pro tier with unlimited AI priority feed, resume SWOT intelligence, and automated GitHub sync.',
  openGraph: {
    title: 'Pricing — PrioryxAI Student & Campus Plans',
    description:
      'Simple, transparent pricing for engineering students. Free starter tier and ₹59/month Pro tier with AI intelligence.',
    url: 'https://www.prioryxai.in/pricing',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PrioryxAI Pricing',
      },
    ],
  },
};

export default function PricingPage() {
  return <PricingPageView />;
}
