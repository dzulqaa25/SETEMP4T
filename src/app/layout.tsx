import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SETEMP4T — Portal Kelas ST04 IPB',
  description: 'Pusat informasi, kas, dan kelompok Kelas ST04 IPB University.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${inter.className} min-h-screen font-normal antialiased`}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
