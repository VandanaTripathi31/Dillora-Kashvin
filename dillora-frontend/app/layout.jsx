import { Fraunces, Inter } from 'next/font/google';
import '@/styles/index.css';
import '@/styles/app.css';
import '@/styles/tailwind.css';

import { AuthProvider } from '@/context/AuthContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { CartProvider } from '@/context/CartContext';
import { SettingsProvider } from '@/context/SettingsContext';
import LoadingSplash from '@/components/LoadingSplash';
import ScrollProgress from '@/components/ScrollProgress';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kashvin.in';
const SITE_DESC =
  'Handmade mobile covers, charms, crochet, resin art and oversize t-shirts — each piece crafted with care and made to order by Dillora by Kashvin in India.';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Dillora by Kashvin — Handmade with love',
    template: '%s · Dillora by Kashvin',
  },
  description: SITE_DESC,
  applicationName: 'Dillora by Kashvin',
  authors: [{ name: 'Dillora by Kashvin' }],
  creator: 'Dillora by Kashvin',
  keywords: [
    'Dillora by Kashvin', 'handmade mobile covers', 'phone charms', 'crochet',
    'resin art', 'oversize t-shirts', 'handmade gifts India', 'made to order',
  ],
  alternates: { canonical: '/' },
  icons: { icon: '/favicon.png', shortcut: '/favicon.png', apple: '/favicon.png' },
  openGraph: {
    type: 'website',
    siteName: 'Dillora by Kashvin',
    title: 'Dillora by Kashvin — Handmade with love',
    description: SITE_DESC,
    url: '/',
    locale: 'en_IN',
    images: [{ url: '/logo.png', width: 1537, height: 1391, alt: 'Dillora by Kashvin' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dillora by Kashvin — Handmade with love',
    description: SITE_DESC,
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
};

export const viewport = {
  themeColor: '#a64fd6',
  width: 'device-width',
  initialScale: 1,
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'Dillora by Kashvin',
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      description: SITE_DESC,
      email: 'support@kashvin.in',
      areaServed: 'IN',
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'Dillora by Kashvin',
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage: 'en-IN',
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <SettingsProvider>
                <LoadingSplash />
                <ScrollProgress />
                {children}
              </SettingsProvider>
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
