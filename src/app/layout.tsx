// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar    from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import { BookmarkProvider } from '@/context/BookmarkContext';
import { HistoryProvider }  from '@/context/HistoryContext';

export const metadata: Metadata = {
  title:       { default: 'ShiiiNime', template: '%s | ShiiiNime' },
  description: 'Streaming anime, hentai & baca komik online.',
  manifest:    '/manifest.json',
  icons:       { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
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
        <HistoryProvider>
          <BookmarkProvider>
            {/*
              Do NOT use overflow-x-hidden on any ancestor of scroll rows —
              it will prevent horizontal scrolling inside them.
              Width is constrained naturally by the viewport.
            */}
            <div className="flex flex-col min-h-screen w-full">
              <Navbar />
              <main className="flex-1 app-shell w-full">
                {children}
              </main>
              <BottomNav />
            </div>
          </BookmarkProvider>
        </HistoryProvider>
      </body>
    </html>
  );
}
