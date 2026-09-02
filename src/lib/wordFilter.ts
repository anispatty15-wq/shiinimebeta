// src/lib/wordFilter.ts
// ─────────────────────────────────────────────────────────────
// Word filter for comments.
// Blocks: kata kasar, piracy/fanshare terms, developer harassment.
// Returns the cleaned text or throws if text is fully blocked.
// ─────────────────────────────────────────────────────────────

// ── Blocked phrases — exact match (case-insensitive) ─────────
// Piracy & fanshare
const BLOCKED_PHRASES = [
  'fanshare', 'fan share', 'fansub steal', 'nyuri sub',
  'stolen sub', 'stolen translation', 'reupload',
  'copas sub', 'copas terjemahan', 'maling sub',
  'bajak sub', 'bajak konten', 'plagiat sub',
  'fanslation steal', 'credit thief',
  // Developer harassment
  'dev maling', 'dev nyuri', 'dev plagiat',
  'developer curang', 'developer maling',
  'dev bangsat', 'dev brengsek',
  'web maling', 'web nyuri', 'web bajak',
  'shiinime maling', 'shiinime nyuri',
  // Piracy enablement
  'link download illegal', 'download gratis di', 'telegram @',
];

// ── Bad words — censor with asterisks ────────────────────────
const BAD_WORDS = [
  // Indonesian
  'anjing', 'anjir', 'anying', 'babi', 'bangsat', 'brengsek',
  'bajingan', 'goblok', 'goblog', 'tolol', 'idiot', 'bodoh bgt',
  'kontol', 'memek', 'ngentot', 'ngewe', 'jancok', 'jancuk',
  'cok', 'matamu', 'asu', 'celeng', 'bego', 'begomu',
  'kampret', 'keparat', 'tai', 'taik', 'taek',
  // Common English
  'fuck', 'f*ck', 'fck', 'shit', 'sh*t', 'bitch', 'b*tch',
  'asshole', 'a**hole', 'dick', 'd*ck', 'cunt', 'nigga',
  'bastard', 'moron', 'retard',
];

type FilterResult = {
  blocked:    boolean;
  reason?:    string;
  cleanText?: string;
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[0@]/g,   'o')
    .replace(/[1!|]/g,  'i')
    .replace(/3/g,      'e')
    .replace(/4/g,      'a')
    .replace(/\$/g,     's')
    .replace(/ph/g,     'f')
    .replace(/\s+/g,    ' ')
    .trim();
}

function censorWord(word: string): string {
  if (word.length <= 2) return word[0] + '*'.repeat(word.length - 1);
  return word[0] + '*'.repeat(word.length - 2) + word[word.length - 1];
}

export function filterComment(text: string): FilterResult {
  if (!text?.trim()) return { blocked: true, reason: 'Komentar kosong.' };
  if (text.length > 500) return { blocked: true, reason: 'Komentar terlalu panjang (max 500 karakter).' };

  const normalized = normalize(text);

  // ── Check blocked phrases (hard block) ───────────────────
  for (const phrase of BLOCKED_PHRASES) {
    if (normalized.includes(normalize(phrase))) {
      return {
        blocked: true,
        reason: 'Komentar mengandung konten yang tidak diizinkan (piracy / fanshare / harassment).',
      };
    }
  }

  // ── Censor bad words ──────────────────────────────────────
  let cleanText = text;
  for (const word of BAD_WORDS) {
    // Build regex that handles word boundaries loosely
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex   = new RegExp(`(?<![a-z])${escaped}(?![a-z])`, 'gi');
    cleanText = cleanText.replace(regex, (match) => censorWord(match));
  }

  return { blocked: false, cleanText };
}

export function isCommentAllowed(text: string): { ok: boolean; reason?: string; cleaned?: string } {
  const result = filterComment(text);
  if (result.blocked) return { ok: false, reason: result.reason };
  return { ok: true, cleaned: result.cleanText };
}
