'use client';
// src/app/anime/schedule/page.tsx — Jadwal Rilis Anime

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays } from 'lucide-react';
import { AnimeAPI } from '@/lib/apiClient';
import { useApi } from '@/hooks/useApi';

// ── Day name map (in case API returns English) ─────────────────
const DAY_ID: Record<string, string> = {
  monday:    'Senin',
  tuesday:   'Selasa',
  wednesday: 'Rabu',
  thursday:  'Kamis',
  friday:    'Jumat',
  saturday:  'Sabtu',
  sunday:    'Minggu',
  senin:     'Senin',
  selasa:    'Selasa',
  rabu:      'Rabu',
  kamis:     'Kamis',
  jumat:     'Jumat',
  sabtu:     'Sabtu',
  minggu:    'Minggu',
};

function dayLabel(raw: string): string {
  return DAY_ID[raw.toLowerCase()] ?? raw;
}

// ── Today highlight ────────────────────────────────────────────
const TODAY_EN = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()];

export default function AnimeSchedulePage() {
  const router = useRouter();

  const { data: rawSchedule, loading, error } = useApi(
    useCallback(() => AnimeAPI.getSchedule(), []),
    []
  );

  // Normalise: API may return object {monday:[...], tuesday:[...]}
  // or array [{day:'monday', items:[...]}, ...]
  type ScheduleEntry = { day: string; items: unknown[] };
  let days: ScheduleEntry[] = [];

  if (rawSchedule) {
    if (Array.isArray(rawSchedule)) {
      days = rawSchedule as ScheduleEntry[];
    } else if (typeof rawSchedule === 'object') {
      days = Object.entries(rawSchedule as Record<string, unknown>).map(([day, items]) => ({
        day,
        items: Array.isArray(items) ? items : [],
      }));
    }
  }

  // Day ordering: start from Monday
  const DAY_ORDER = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  days.sort((a, b) => {
    const ai = DAY_ORDER.indexOf(a.day.toLowerCase());
    const bi = DAY_ORDER.indexOf(b.day.toLowerCase());
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      {/* Header */}
      <div className="sticky top-14 z-30 bg-bg/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <CalendarDays className="w-5 h-5 text-cyan flex-shrink-0" aria-hidden />
        <h1 className="text-[0.95rem] font-bold text-primary">Jadwal Rilis Anime</h1>
      </div>

      <div className="px-4 pt-5">
        {loading && (
          <div className="space-y-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="rounded-app bg-surface animate-pulse h-32" />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-20 text-muted">
            <span className="text-4xl block mb-3" aria-hidden>😵</span>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && days.length === 0 && (
          <div className="text-center py-20 text-muted">
            <span className="text-4xl block mb-3" aria-hidden>📅</span>
            <p className="text-sm">Jadwal belum tersedia.</p>
          </div>
        )}

        {/* Schedule grid */}
        <div className="space-y-4">
          {days.map((d) => {
            const isToday = d.day.toLowerCase() === TODAY_EN;
            return (
              <div
                key={d.day}
                className={`rounded-app border overflow-hidden ${
                  isToday ? 'border-cyan/40' : 'border-border'
                }`}
              >
                {/* Day header */}
                <div className={`px-4 py-2.5 flex items-center justify-between ${
                  isToday ? 'bg-cyan/10' : 'bg-surface'
                }`}>
                  <span className={`text-sm font-bold ${isToday ? 'text-cyan' : 'text-primary'}`}>
                    {dayLabel(d.day)}
                    {isToday && (
                      <span className="ml-2 text-[0.65rem] font-semibold bg-cyan text-bg px-1.5 py-0.5 rounded-full">
                        Hari ini
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-muted">{d.items.length} anime</span>
                </div>

                {/* Anime list */}
                <div className="divide-y divide-border">
                  {d.items.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-muted">Tidak ada jadwal.</p>
                  ) : (
                    d.items.map((raw, idx) => {
                      const item = raw as Record<string, unknown>;
                      const slug  = String(item.slug ?? item.id ?? item.animeSlug ?? '');
                      const title = String(item.title ?? item.name ?? '');
                      const ep    = item.episode ?? item.ep ?? item.currentEpisode;
                      const time  = String(item.time ?? item.airTime ?? item.air_time ?? '');

                      return (
                        <button
                          key={slug || idx}
                          disabled={!slug}
                          onClick={() => slug && router.push(`/anime/${slug}`)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-2 transition-colors text-left disabled:opacity-50 disabled:cursor-default"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {time && (
                              <span className="text-[0.7rem] font-mono text-muted flex-shrink-0 w-10">
                                {time}
                              </span>
                            )}
                            <span className="text-sm font-medium text-primary truncate">{title}</span>
                          </div>
                          {ep != null && (
                            <span className="text-xs text-secondary flex-shrink-0 ml-3 bg-surface px-2 py-0.5 rounded-full border border-border">
                              Ep. {ep}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
