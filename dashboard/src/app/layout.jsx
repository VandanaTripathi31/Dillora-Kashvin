import { Fraunces, Inter } from 'next/font/google';
import '@/styles/index.css';
import '@/styles/app.css';
import '@/styles/tailwind.css';
import '@/styles/dashboard.css';

import { AuthProvider } from '@/context/AuthContext';
import AdminToaster from '@/components/AdminToaster';
import ConfirmRoot from '@/components/ConfirmRoot';

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
  title: 'Dillora Admin',
  description: 'Dillora by Kashvin — admin dashboard',
  icons: { icon: '/favicon.png', shortcut: '/favicon.png' },
  robots: { index: false, follow: false },
};

export const viewport = {
  themeColor: '#a64fd6',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <AuthProvider>
          {children}
          <AdminToaster />
          <ConfirmRoot />
        </AuthProvider>
      </body>
    </html>
  );
}
