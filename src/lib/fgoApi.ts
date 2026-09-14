export type FgoRegion = 'JP' | 'NA';

export interface FgoEntity {
  id: number;
  collectionNo?: number;
  name: string;
  originalName?: string;
  className?: string;
  rarity?: number;
  type?: string;
  description?: string;
  image?: string;
  face?: string;
  icon?: string;
  startTime?: number;
  endTime?: number;
  [key: string]: unknown;
}

export interface FgoInfo {
  hash: string;
  timestamp: number;
}

export const FGO_REGIONS: FgoRegion[] = ['JP', 'NA'];

export const FGO_LAUNCHER_CONFIG = {
  iconUrl: '/logo.png',
  title: 'FGO Database',
  position: 'right-5 bottom-24 md:bottom-6',
};

const SECTION_PATHS: Record<string, string> = {
  servants: 'servant',
  'craft-essences': 'equip',
  skills: 'skill',
  'noble-phantasms': 'NP',
  items: 'item',
  events: 'event',
  quests: 'quest',
  gacha: 'gacha',
  wars: 'war',
  enemies: 'enemy-master',
  'mystic-codes': 'MC',
  'command-codes': 'CC',
  servant: 'servant',
  equip: 'equip',
  skill: 'skill',
  NP: 'NP',
  event: 'event',
  quest: 'quest',
  item: 'item',
  gacha: 'gacha',
  war: 'war',
  'enemy-master': 'enemy-master',
  buffs: 'buff',
  scripts: 'script',
  shops: 'shop',
};

const cache = new Map<string, { expires: number; value: unknown }>();

function getCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || entry.expires < Date.now()) return null;
  return entry.value as T;
}

async function request<T>(path: string, params?: Record<string, string | number | undefined>, ttl = 60_000): Promise<T> {
  const query = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  const url = `/api/fgo/${path}${query.size ? `?${query}` : ''}`;
  const cached = getCache<T>(url);
  if (cached) return cached;
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`FGO API ${response.status}`);
  const value = await response.json() as T;
  cache.set(url, { expires: Date.now() + ttl, value });
  return value;
}

function asArray(raw: unknown): FgoEntity[] {
  const value = raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)
    ? (raw as { data: unknown[] }).data
    : Array.isArray(raw) ? raw : [];
  return value.filter((item): item is FgoEntity => Boolean(item && typeof item === 'object'))
    .map((item) => {
      const entry = item as FgoEntity;
      return { ...entry, id: Number(entry.id ?? entry.collectionNo ?? 0), name: String(entry.name ?? entry.originalName ?? 'Unknown') };
    })
    .filter((item) => item.id > 0);
}

export const FgoAPI = {
  getInfo: () => request<Record<string, FgoInfo>>('info', undefined, 300_000),
  search: async (region: FgoRegion, section: string, query: string) => {
    const path = SECTION_PATHS[section] ?? section;
    const raw = await request<unknown>(`basic/${region}/${path}/search`, { name: query || 'a' }, 120_000);
    return asArray(raw);
  },
  getDetail: async (region: FgoRegion, section: string, id: string) => {
    const path = SECTION_PATHS[section] ?? section;
    return request<FgoEntity>(`nice/${region}/${path}/${encodeURIComponent(id)}`, undefined, 300_000);
  },
  getFeaturedServants: async (region: FgoRegion) => {
    const raw = await request<unknown>(`basic/${region}/servant/search`, { name: 'a' }, 120_000);
    return asArray(raw).slice(0, 12);
  },
};

export function formatFgoDate(value?: number): string {
  if (!value) return 'N/A';
  const date = new Date(value * 1000);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('id-ID');
}

export function fgoImage(entity?: FgoEntity | null): string {
  return entity?.face ?? entity?.image ?? entity?.icon ?? '';
}