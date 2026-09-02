// src/lib/xp.ts
// ─────────────────────────────────────────────────────────────
// XP & Level System
//
// Firestore: /users/{uid}
//   xp:          number   (total XP)
//   totalMinutes: number  (total minutes watched)
//   level:        number  (derived from xp)
//
// XP Sources:
//   • 1 XP per minute watched (capped at 30 XP per episode)
//   • 5 XP per comment posted
//   • 10 XP first time watch an episode
// ─────────────────────────────────────────────────────────────

export interface LevelInfo {
  level:      number;
  name:       string;
  badge:      string;   // emoji
  color:      string;   // tailwind color class
  minXP:      number;
  maxXP:      number;   // XP needed for next level (0 = max)
  nextLevel:  string;
}

export const LEVELS: LevelInfo[] = [
  { level: 1,  name: 'Newbie Wibu',     badge: '🌱', color: 'text-gray-400',   minXP: 0,    maxXP: 100,   nextLevel: 'Wibu Kasual' },
  { level: 2,  name: 'Wibu Kasual',     badge: '📺', color: 'text-green-400',  minXP: 100,  maxXP: 300,   nextLevel: 'Anime Lover' },
  { level: 3,  name: 'Anime Lover',     badge: '💚', color: 'text-cyan-400',   minXP: 300,  maxXP: 600,   nextLevel: 'Otaku' },
  { level: 4,  name: 'Otaku',           badge: '⭐', color: 'text-blue-400',   minXP: 600,  maxXP: 1000,  nextLevel: 'Super Otaku' },
  { level: 5,  name: 'Super Otaku',     badge: '🌟', color: 'text-yellow-400', minXP: 1000, maxXP: 1800,  nextLevel: 'Otaku Elite' },
  { level: 6,  name: 'Otaku Elite',     badge: '💎', color: 'text-purple-400', minXP: 1800, maxXP: 3000,  nextLevel: 'Anime God' },
  { level: 7,  name: 'Anime God',       badge: '👑', color: 'text-orange-400', minXP: 3000, maxXP: 5000,  nextLevel: 'Legend Wibu' },
  { level: 8,  name: 'Legend Wibu',     badge: '🏆', color: 'text-pink-400',   minXP: 5000, maxXP: 8000,  nextLevel: 'Dewa Weeb' },
  { level: 9,  name: 'Dewa Weeb',       badge: '⚡', color: 'text-red-400',    minXP: 8000, maxXP: 12000, nextLevel: 'Eternal Otaku' },
  { level: 10, name: 'Eternal Otaku',   badge: '🔥', color: 'text-rose-500',   minXP: 12000, maxXP: 0,   nextLevel: '' },
];

export function getLevelFromXP(xp: number): LevelInfo {
  let current = LEVELS[0]!;
  for (const lvl of LEVELS) {
    if (xp >= lvl.minXP) current = lvl;
    else break;
  }
  return current;
}

export function getXPProgress(xp: number): {
  current:    LevelInfo;
  xpInLevel:  number;
  xpNeeded:   number;
  percent:    number;
} {
  const current   = getLevelFromXP(xp);
  const xpInLevel = xp - current.minXP;
  const xpNeeded  = current.maxXP > 0 ? current.maxXP - current.minXP : 1;
  const percent   = current.maxXP === 0 ? 100 : Math.min(100, (xpInLevel / xpNeeded) * 100);
  return { current, xpInLevel, xpNeeded, percent };
}

// XP rewards
export const XP_PER_MINUTE   = 1;    // 1 XP per minute watched
export const XP_MAX_PER_EP   = 30;   // max 30 XP per episode (30 min cap)
export const XP_FIRST_WATCH  = 10;   // bonus for first time watching
export const XP_COMMENT      = 5;    // per comment posted

export function calcWatchXP(minutes: number, isFirstWatch: boolean): number {
  const watchXP = Math.min(XP_MAX_PER_EP, Math.floor(minutes) * XP_PER_MINUTE);
  return watchXP + (isFirstWatch ? XP_FIRST_WATCH : 0);
}
