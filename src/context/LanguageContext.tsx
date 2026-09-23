'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Language = 'id' | 'en' | 'ja';
export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'shiinime-language';
const THEME_STORAGE_KEY = 'shiinime-theme';

const translations = {
  id: {
    home: 'Beranda', anime: 'Anime', donghua: 'Donghua', hentai: 'Hentai', comic: 'Komik',
    schedule: 'Jadwal', filter: 'Filter', jikan: 'Jikan', friends: 'Teman', notifications: 'Notifikasi',
    history: 'Riwayat', favorites: 'Favorit', tools: 'Tools', myProfile: 'Profil Saya', adminDashboard: 'Dashboard Admin',
    bookmarks: 'Bookmark', logout: 'Keluar', login: 'Masuk', profile: 'Profil', closeMenu: 'Tutup menu',
    openMenu: 'Buka menu', search: 'Cari', language: 'Bahasa', theme: 'Tema', darkMode: 'Mode gelap',
    lightMode: 'Mode terang', back: 'Kembali', editProfile: 'Edit Profil', addFriend: 'Tambah Teman',
    pending: 'Menunggu', acceptRequest: 'Terima Permintaan', follow: 'Ikuti', following: 'Mengikuti',
    chat: 'Chat', share: 'Bagikan', admin: 'Admin', bio: 'Bio', content18: 'Akses Konten 18+',
  },
  en: {
    home: 'Home', anime: 'Anime', donghua: 'Donghua', hentai: 'Hentai', comic: 'Comics',
    schedule: 'Schedule', filter: 'Filter', jikan: 'Jikan', friends: 'Friends', notifications: 'Notifications',
    history: 'History', favorites: 'Favorites', tools: 'Tools', myProfile: 'My Profile', adminDashboard: 'Admin Dashboard',
    bookmarks: 'Bookmarks', logout: 'Logout', login: 'Login', profile: 'Profile', closeMenu: 'Close menu',
    openMenu: 'Open menu', search: 'Search', language: 'Language', theme: 'Theme', darkMode: 'Dark mode',
    lightMode: 'Light mode', back: 'Back', editProfile: 'Edit Profile', addFriend: 'Add Friend',
    pending: 'Pending', acceptRequest: 'Accept Request', follow: 'Follow', following: 'Following',
    chat: 'Chat', share: 'Share', admin: 'Admin', bio: 'Bio', content18: '18+ Content Access',
  },
  ja: {
    home: 'ホーム', anime: 'アニメ', donghua: '中国アニメ', hentai: 'アダルト', comic: 'コミック',
    schedule: 'スケジュール', filter: 'フィルター', jikan: 'Jikan', friends: '友達', notifications: '通知',
    history: '履歴', favorites: 'お気に入り', tools: 'ツール', myProfile: 'プロフィール', adminDashboard: '管理ダッシュボード',
    bookmarks: 'ブックマーク', logout: 'ログアウト', login: 'ログイン', profile: 'プロフィール',
    closeMenu: 'メニューを閉じる', openMenu: 'メニューを開く', search: '検索', language: '言語', theme: 'テーマ', darkMode: 'ダークモード',
    lightMode: 'ライトモード', back: '戻る', editProfile: 'プロフィールを編集', addFriend: '友達を追加',
    pending: '保留中', acceptRequest: 'リクエストを承認', follow: 'フォロー', following: 'フォロー中',
    chat: 'チャット', share: '共有', admin: '管理者', bio: '自己紹介', content18: '18歳以上コンテンツ',
  },
} as const;

type TranslationKey = keyof typeof translations.id;

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'id';
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'id' || stored === 'en' || stored === 'ja' ? stored : 'id';
  });
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'light';
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language === 'ja' ? 'ja' : language;
  }, [language]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage: (nextLanguage) => setLanguageState(nextLanguage),
    theme,
    setTheme: (nextTheme) => setThemeState(nextTheme),
    t: (key) => translations[language][key],
  }), [language, theme]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}
