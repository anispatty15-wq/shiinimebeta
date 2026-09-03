// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar        from '@/components/Navbar';
import BottomNav     from '@/components/BottomNav';
import SubBanner     from '@/components/SubBanner';
import FloatingLinks from '@/components/FloatingLinks';
import AntiInspect   from '@/components/AntiInspect';
import PageLoader    from '@/components/PageLoader';
import NotificationPrompt from '@/components/NotificationPrompt';
import NotificationToast from '@/components/NotificationToast';
import InstallPrompt from '@/components/InstallPrompt';
import { BookmarkProvider } from '@/context/BookmarkContext';
import { HistoryProvider }  from '@/context/HistoryContext';
import { AuthProvider }     from '@/context/AuthContext';

export const metadata: Metadata = {
  title:       { default: 'ShiiiNime', template: '%s | ShiiiNime' },
  description: 'Streaming anime, hentai & baca komik online.',
  manifest:    '/manifest.json',
  icons: { icon: [{ url: '/icon.svg', type: 'image/svg+xml' }, '/favicon.ico'], apple: '/icon.svg' },
  keywords:    ['anime', 'streaming', 'manga', 'komik', 'manhwa'],
};

export const viewport: Viewport = {
  themeColor:         '#0F0F12',
  width:              'device-width',
  initialScale:       1,
  minimumScale:       1,
  viewportFit:        'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="dark">
      <body className="bg-bg text-primary antialiased">
        <AntiInspect />
        <PageLoader />
        <AuthProvider>
          <HistoryProvider>
            <BookmarkProvider>
              <div className="flex flex-col min-h-screen w-full">
                <Navbar />
                <NotificationToast />
                <main className="flex-1 app-shell w-full">
                  {children}
                </main>
                <BottomNav />
                <SubBanner />
                <FloatingLinks />
                <NotificationPrompt />
                <InstallPrompt />
              </div>
            </BookmarkProvider>
          </HistoryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
