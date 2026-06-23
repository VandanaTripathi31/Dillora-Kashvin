import { Fraunces, Inter } from 'next/font/google';
import '@/styles/index.css';
import '@/styles/app.css';

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

export const metadata = {
  title: 'Dillora by Kashvin — Handmade with love',
  description: 'Handmade mobile covers, charms, crochet, resin art and oversize t-shirts. Crafted with care by Dillora by Kashvin.',
  icons: { icon: '/favicon.png' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
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
