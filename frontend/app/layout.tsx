import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import MotionReveal from '@/components/MotionReveal';
import PageTransition from '@/components/PageTransition';
import { SiteDataProvider } from '@/lib/site-data';

const display = localFont({
  src: './fonts/CormorantGaramond.ttf',
  variable: '--font-display',
  weight: '500 700',
  display: 'swap',
});

const sans = localFont({
  src: './fonts/Manrope.ttf',
  variable: '--font-sans',
  weight: '400 700',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Himalayan Estates | Places with a point of view',
  description: 'Curated hotels, land, homes and commercial property in Manali, Himachal Pradesh.',
  icons: {
    icon: { url: '/favicon.png', type: 'image/png' },
    apple: '/favicon.png',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable}`}><SiteDataProvider><a className="skip-link" href="#main-content">Skip to content</a><PageTransition>{children}</PageTransition><MotionReveal /></SiteDataProvider></body>
    </html>
  );
}
