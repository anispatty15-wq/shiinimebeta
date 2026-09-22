// src/app/donghua/schedule/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Jadwal Donghua',
  description: 'Jadwal tayang donghua (anime China) terbaru',
};

const API_BASE = 'https://www.sankavollerei.web.id';

interface ScheduleItem {
  title: string;
  slug: string;
  poster?: string;
  day?: string;
  time?: string;
  episode?: string;
}

interface ScheduleByDay {
  [day: string]: ScheduleItem[];
}

async function getDonghuaSchedule() {
  try {
    const res = await fetch(`${API_BASE}/anime/donghua/schedule`, {
      next: { revalidate: 3600 } // Cache 1 hour
    });
    if (!res.ok) throw new Error('Failed to fetch');
    const json = await res.json();
    return json.data || {};
  } catch (error) {
    console.error('Error fetching donghua schedule:', error);
    return {};
  }
}

const DAYS = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
  'Minggu'
];

export default async function DonghuaSchedulePage() {
  const scheduleData: ScheduleByDay = await getDonghuaSchedule();

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Calendar className="w-6 h-6 text-yellow-400" />
            Jadwal Tayang Donghua
          </h1>
          <p className="text-sm text-secondary mt-2">
            Jadwal tayang donghua (anime China) setiap minggu
          </p>
        </div>

        {/* Schedule by Day */}
        <div className="space-y-6">
          {DAYS.map((day) => {
            const items = scheduleData[day] || scheduleData[day.toLowerCase()] || [];
            
            if (items.length === 0) return null;

            return (
              <section key={day}>
                <h2 className="text-lg font-bold text-primary mb-4 pb-2 border-b border-border">
                  {day}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {items.map((item, idx) => (
                    <Link
                      key={`${item.slug}-${idx}`}
                      href={`/detail/donghua/${item.slug}`}
                      className="group"
                    >
                      <div className="relative aspect-[2/3] rounded-app overflow-hidden bg-surface-2 mb-2">
                        {item.poster ? (
                          <Image
                            src={item.poster}
                            alt={item.title}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-muted">
                            ?
                          </div>
                        )}
                        {item.episode && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                            <span className="text-xs text-white font-medium">
                              {item.episode}
                            </span>
                          </div>
                        )}
                      </div>
                      <h3 className="text-sm font-medium text-primary line-clamp-2 group-hover:text-yellow-400 transition-colors">
                        {item.title}
                      </h3>
                      {item.time && (
                        <p className="text-xs text-muted mt-1">
                          {item.time}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {Object.keys(scheduleData).length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-muted mx-auto mb-4 opacity-50" />
            <p className="text-secondary">Jadwal tayang belum tersedia</p>
          </div>
        )}
      </div>
    </div>
  );
}
