// src/app/donghua/page.tsx
import { Metadata } from 'next';
import HeroBanner from '@/components/HeroBanner';
import MediaGrid from '@/components/MediaGrid';
import { MediaCard } from '@/types/media';

export const metadata: Metadata = {
  title: 'Donghua',
  description: 'Nonton donghua (anime China) subtitle Indonesia terbaru',
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.shiiinime.my.id';

async function getDonghuaHome() {
  try {
    const res = await fetch(`${API_BASE}/anime/donghua/home/1`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 } // Cache 1 hour
    });
    if (!res.ok) {
      console.error('Donghua home error:', res.status);
      return [];
    }
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error('Error fetching donghua home:', error);
    return [];
  }
}

async function getDonghuaOngoing() {
  try {
    const res = await fetch(`${API_BASE}/anime/donghua/ongoing/1`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      next: { revalidate: 1800 } // Cache 30 minutes
    });
    if (!res.ok) {
      console.error('Donghua ongoing error:', res.status);
      return [];
    }
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error('Error fetching donghua ongoing:', error);
    return [];
  }
}

async function getDonghuaLatest() {
  try {
    const res = await fetch(`${API_BASE}/anime/donghua/latest/1`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      next: { revalidate: 900 } // Cache 15 minutes
    });
    if (!res.ok) {
      console.error('Donghua latest error:', res.status);
      return [];
    }
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error('Error fetching donghua latest:', error);
    return [];
  }
}

export default async function DonghuaPage() {
  const [homeData, ongoingData, latestData] = await Promise.all([
    getDonghuaHome(),
    getDonghuaOngoing(),
    getDonghuaLatest(),
  ]);

  const hasData = homeData.length > 0 || ongoingData.length > 0 || latestData.length > 0;

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* Hero Banner */}
      <HeroBanner
        title="Donghua"
        subtitle="Nonton donghua (anime China) subtitle Indonesia"
        accentColor="text-yellow-400"
      />

      <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-8">
        {!hasData && (
          <div className="text-center py-12 bg-surface rounded-app border border-border">
            <div className="text-6xl mb-4">🐉</div>
            <h3 className="text-lg font-bold text-primary mb-2">
              Donghua Segera Hadir!
            </h3>
            <p className="text-secondary text-sm">
              API donghua sedang dalam pengembangan. Data akan muncul setelah API tersedia.
            </p>
          </div>
        )}

        {/* Latest Updates */}
        {latestData.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-primary">
                Update Terbaru
              </h2>
              <a
                href="/donghua/latest"
                className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
              >
                Lihat Semua →
              </a>
            </div>
            <MediaGrid items={latestData} type="donghua" />
          </section>
        )}

        {/* Ongoing */}
        {ongoingData.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-primary">
                Sedang Tayang
              </h2>
              <a
                href="/donghua/ongoing"
                className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
              >
                Lihat Semua →
              </a>
            </div>
            <MediaGrid items={ongoingData} type="donghua" />
          </section>
        )}

        {/* Popular/Home */}
        {homeData.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-primary">
                Populer
              </h2>
            </div>
            <MediaGrid items={homeData} type="donghua" />
          </section>
        )}
      </div>
    </div>
  );
}
