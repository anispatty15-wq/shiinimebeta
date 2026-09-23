'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Language = 'id' | 'en' | 'ja';

const STORAGE_KEY = 'shiinime-language';

const translations = {
  id: {
    home: 'Beranda', anime: 'Anime', donghua: 'Donghua', hentai: 'Hentai', comic: 'Komik',
    schedule: 'Jadwal', filter: 'Filter', jikan: 'Jikan', friends: 'Teman', notifications: 'Notifikasi',
    history: 'Riwayat', favorites: 'Favorit', myProfile: 'Profil Saya', adminDashboard: 'Dashboard Admin',
    bookmarks: 'Bookmark', logout: 'Keluar', login: 'Masuk', profile: 'Profil', closeMenu: 'Tutup menu',
    openMenu: 'Buka menu', search: 'Cari', language: 'Bahasa',
  },
  en: {
    home: 'Home', anime: 'Anime', donghua: 'Donghua', hentai: 'Hentai', comic: 'Comics',
    schedule: 'Schedule', filter: 'Filter', jikan: 'Jikan', friends: 'Friends', notifications: 'Notifications',
    history: 'History', favorites: 'Favorites', myProfile: 'My Profile', adminDashboard: 'Admin Dashboard',
    bookmarks: 'Bookmarks', logout: 'Logout', login: 'Login', profile: 'Profile', closeMenu: 'Close menu',
    openMenu: 'Open menu', search: 'Search', language: 'Language',
  },
  ja: {
    home: 'ホーム', anime: 'アニメ', donghua: '中国アニメ', hentai: 'アダルト', comic: 'コミック',
    schedule: 'スケジュール', filter: 'フィルター', jikan: 'Jikan', friends: '友達', notifications: '通知',
    history: '履歴', favorites: 'お気に入り', myProfile: 'プロフィール', adminDashboard: '管理ダッシュボード',
    bookmarks: 'ブックマーク', logout: 'ログアウト', login: 'ログイン', profile: 'プロフィール',
    closeMenu: 'メニューを閉じる', openMenu: 'メニューを開く', search: '検索', language: '言語',
  },
} as const;

type TranslationKey = keyof typeof translations.id;

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('id');

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'id' || stored === 'en' || stored === 'ja') setLanguageState(stored);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language === 'ja' ? 'ja' : language;
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage: (nextLanguage) => setLanguageState(nextLanguage),
    t: (key) => translations[language][key],
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}
