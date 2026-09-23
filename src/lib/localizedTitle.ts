import type { Language } from '@/context/LanguageContext';

export interface LocalizedTitleFields {
  title: string;
  titleEnglish?: string;
  titleJapanese?: string;
  titleIndonesian?: string;
}

export function getLocalizedTitle(item: LocalizedTitleFields, language: Language): string {
  if (language === 'en') return item.titleEnglish || item.title;
  if (language === 'ja') return item.titleJapanese || item.title;
  return item.titleIndonesian || item.title;
}

export function titleMatchesQuery(item: LocalizedTitleFields, query: string): boolean {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return true;
  return [
    item.title,
    item.titleEnglish,
    item.titleJapanese,
    item.titleIndonesian,
  ].some((title) => title?.toLocaleLowerCase().includes(normalizedQuery));
}
