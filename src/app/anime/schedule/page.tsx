'use client';
// src/app/anime/schedule/page.tsx — Jadwal Rilis Anime

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, ChevronRight } from 'lucide-react';
import { AnimeAPI } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { clsx } from 'clsx';

// ── Day mappings ───────────────────────────────────────────────
const DAY_ID: Record<string, string> = {
  monday: 'Senin', tuesday: 'Selasa', wednesday: 'Rabu',
  thursday: 'Kamis', friday: 'Jumat', saturday: 'Sabtu', sunday: 'Minggu',
  senin: 'Senin', selasa: 'Selasa', rabu: 'Rabu',
  kamis: 'Kamis', jumat: 'Jumat', sabtu: 'Sabtu', minggu: 'Minggu',
  mon: 'Senin', tue: 'Selasa', wed: 'Rabu',
  thu: 'Kamis', fri: 'Jumat', sat: 'Sabtu', sun: 'Minggu',
};

const DAY_ORDER = [
  'monday','tuesday','wednesday','thursday','friday','saturday','sunday',
  'senin','selasa','rabu','kamis','jumat','sabtu','minggu',
];

const TODAY_EN = [
  'sunday','monday','tuesday','wednesday','thursday','friday','saturday',
][new Date().getDay()] ?? '';

function dayLabel(raw: string): string {
  return DAY_ID[raw.toLowerCase()] ?? raw.charAt(0).toUpperCase() + raw.slice(1);
}

interface ScheduleItem {
  slug:    string;
  title:   string;
  episode: string;
  time:    string;
}

interface ScheduleDay {
  day:   string;
  items: ScheduleItem[];
}

// ── Normalise any schedule API shape ─────────────────────────
function normaliseSchedule(raw: unknown): ScheduleDay[] {
  if (!raw || typeof raw !== 'object') return [];

  // Shape 1: Array of day objects — [{day:'monday', items:[...]}]
  if (Array.isArray(raw)) {
    return raw.flatMap((entry): ScheduleDay[] => {
      if (!entry || typeof entry !== 'object') return [];
      const e = entry as Record<string, unknown>;
      const day = String(e.day ?? e.name ?? e.weekday ?? '');
      if (!day) return [];
      const items = normaliseItems(e.items ?? e.animes ?? e.list ?? e.data ?? []);
      return [{ day, items }];
    });
  }

  const o = raw as Record<string, unknown>;

  // Shape 2: { data: {monday:[...], tuesday:[...]} }
  // or { data: [{day,items}] }
  if (o.data) return normaliseSchedule(o.data);

  // Shape 3: Flat object keys are day names — {monday:[...], tuesday:[...]}
  // Also handles: {creator:[], source:[], data:[]} — ignore non-day keys
  const days: ScheduleDay[] = [];
  for (const [key, value] of Object.entries(o)) {
    const lkey = key.toLowerCase();
    // Accept key if it matches a known day name OR if value is non-empty array
    const isDayKey = DAY_ORDER.includes(lkey);
    if (!isDayKey) continue;
    const items = normaliseItems(value);
    days.push({ day: lkey, items });
  }
  if (days.length > 0) return days;

  // Shape 4: Object where values ARE the day objects
  // {0: {day:'monday', animes:[]}, 1: {day:'tuesday', animes:[]}}
  const vals = Object.values(o);
  if (vals.length > 0 && typeof vals[0] === 'object' && vals[0] !== null) {
    return normaliseSchedule(vals);
  }

  return [];
}

function normaliseItems(raw: unknown): ScheduleItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item): ScheduleItem | null => {
    if (!item || typeof item !== 'object') return null;
    const o = item as Record<string, unknown>;
    const slug = String(o.slug ?? o.animeSlug ?? o.id ?? o.link ?? '');
    const title = String(o.title ?? o.name ?? o.anime ?? '');
    if (!title) return null;
    return {
      slug,
      title,
      episode: String(o.episode ?? o.ep ?? o.currentEpisode ?? ''),
      time:    String(o.time ?? o.airTime ?? o.air_time ?? o.releaseTime ?? ''),
    };
  }).filter(Boolean) as ScheduleItem[];
}

// ─────────────────────────────────────────────────────────────
export default function AnimeSchedulePage() {
  const router = useRouter();

  const { data: rawSchedule, loading, error } = useApi(
    useCallback(() => AnimeAPI.getSchedule(), []),
    []
  );

  const days = normaliseSchedule(rawSchedule)
    .sort((a, b) => {
      const ai = DAY_ORDER.indexOf(a.day.toLowerCase());
      const bi = DAY_ORDER.indexOf(b.day.toLowerCase());
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

  // Debug: show raw structure
  const hasData = days.some((d) => d.items.length > 0);

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      {/* Header */}
      <div className="sticky top-14 z-30 bg-bg/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-cyan flex-shrink-0" aria-hidden />
        <h1 className="text-[0.95rem] font-bold text-primary">Jadwal Rilis Anime</h1>
      </div>

      <div className="px-4 pt-5">
        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="rounded-app bg-surface animate-pulse h-24" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-20 text-muted">
            <span className="text-4xl block mb-3" aria-hidden>😵</span>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* No data at all */}
        {!loading && !error && days.length === 0 && (
          <div className="text-center py-20 text-muted space-y-3">
            <span className="text-4xl block" aria-hidden>📅</span>
            <p className="text-sm font-medium">Jadwal tidak tersedia.</p>
            <p className="text-xs max-w-xs mx-auto">
              API mungkin mengembalikan format berbeda.
            </p>
            {/* Debug: show raw data */}
            <details className="text-left max-w-sm mx-auto mt-4">
              <summary className="text-xs cursor-pointer text-cyan">Lihat raw data API</summary>
              <pre className="mt-2 text-[0.6rem] text-secondary bg-surface border border-border rounded p-2 overflow-x-auto max-h-48 whitespace-pre-wrap break-all">
                {JSON.stringify(rawSchedule, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Days with empty items */}
        {!loading && !error && days.length > 0 && !hasData && (
          <div className="text-center py-12 text-muted space-y-2">
            <p className="text-sm">Jadwal tersedia tapi tidak ada anime dalam daftar.</p>
            <details className="text-left max-w-sm mx-auto mt-4">
              <summary className="text-xs cursor-pointer text-cyan">Lihat raw data API</summary>
              <pre className="mt-2 text-[0.6rem] text-secondary bg-surface border border-border rounded p-2 overflow-x-auto max-h-48 whitespace-pre-wrap break-all">
                {JSON.stringify(rawSchedule, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Schedule */}
        {!loading && days.length > 0 && hasData && (
          <div className="space-y-3">
            {days.map((d) => {
              const isToday = d.day.toLowerCase() === TODAY_EN;
              return (
                <div
                  key={d.day}
                  className={clsx(
                    'rounded-app border overflow-hidden',
                    isToday ? 'border-cyan/40' : 'border-border'
                  )}
                >
                  {/* Day header */}
                  <div className={clsx(
                    'px-4 py-2.5 flex items-center justify-between',
                    isToday ? 'bg-cyan/10' : 'bg-surface'
                  )}>
                    <span className={clsx(
                      'text-sm font-bold',
                      isToday ? 'text-cyan' : 'text-primary'
                    )}>
                      {dayLabel(d.day)}
                      {isToday && (
                        <span className="ml-2 text-[0.62rem] font-bold bg-cyan text-bg px-1.5 py-0.5 rounded-full">
                          Hari ini
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted">{d.items.length} anime</span>
                  </div>

                  {/* Anime rows */}
                  {d.items.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-muted italic">Tidak ada jadwal.</p>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {d.items.map((item, idx) => (
                        <button
                          key={item.slug || idx}
                          disabled={!item.slug}
                          onClick={() => item.slug && router.push(`/detail/anime/${item.slug}`)}
                          className={clsx(
                            'w-full flex items-center justify-between px-4 py-3 text-left transition-colors',
                            item.slug
                              ? 'hover:bg-surface-2 cursor-pointer'
                              : 'opacity-60 cursor-default'
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {item.time && (
                              <span className="text-[0.68rem] font-mono text-muted flex-shrink-0 w-10 tabular-nums">
                                {item.time}
                              </span>
                            )}
                            <span className="text-sm font-medium text-primary truncate">
                              {item.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            {item.episode && (
                              <span className="text-[0.68rem] text-muted bg-surface border border-border px-2 py-0.5 rounded-full">
                                Ep.{item.episode}
                              </span>
                            )}
                            {item.slug && (
                              <ChevronRight className="w-3.5 h-3.5 text-muted" aria-hidden />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
