'use client';

import { ExternalLink, Instagram, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const WUWA_URL = 'https://wuwatracker.com/id';
const WA_URL = 'https://chat.whatsapp.com/FRWb2JXmQx14u39x0yhshZ';
const INSTAGRAM_URL = 'https://www.instagram.com/shiinimeoffc?stkn=MW5pZXo5ZWkxaXVnbQ==';

export default function SocialLinks() {
  const { language } = useLanguage();
  const copy = language === 'ja'
    ? {
        title: 'ソーシャル＆インターネット',
        wuwa: 'Wuthering Waves トラッカー',
        wuwaText: 'バナー、キャラクター、進行状況を確認できます。',
        wa: 'WhatsApp コミュニティ',
        waText: 'アニメについて話したり、最新情報を受け取れます。',
        instagram: 'Shiinime Instagram',
        instagramText: 'ニュース、更新情報、コンテンツをチェックしてください。',
        open: '開く',
        join: '参加する',
      }
    : language === 'en'
      ? {
          title: 'Social & Internet',
          wuwa: 'Wuthering Waves Tracker',
          wuwaText: 'Check banners, characters, tier lists, and progress.',
          wa: 'WhatsApp Community',
          waText: 'Join the Shiinime anime discussion community.',
          instagram: 'Shiinime Instagram',
          instagramText: 'Follow news, updates, and content from Shiinime.',
          open: 'Open',
          join: 'Join now',
        }
      : {
          title: 'Sosial & Internet',
          wuwa: 'Wuthering Waves Tracker',
          wuwaText: 'Cek banner, karakter, tier list, dan progress.',
          wa: 'Komunitas WhatsApp',
          waText: 'Gabung komunitas diskusi anime Shiinime.',
          instagram: 'Instagram Shiinime',
          instagramText: 'Ikuti berita, update, dan konten terbaru Shiinime.',
          open: 'Buka',
          join: 'Gabung',
        };

  return (
    <section className="mx-4 mb-24 mt-12 md:mb-10" aria-labelledby="social-links-title">
      <h2 id="social-links-title" className="mb-4 flex items-center gap-2 text-xl font-bold text-primary">
        <span className="text-cyan">🌐</span>
        {copy.title}
      </h2>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        <a
          href={WUWA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 items-center gap-3 rounded-app border border-border bg-surface p-3 transition-colors hover:border-cyan/50"
        >
          <img src="/wuwa.gif" alt="Wuthering Waves" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
          <span className="min-w-0 flex-1">
            <strong className="block truncate text-sm text-primary">{copy.wuwa}</strong>
            <span className="mt-1 block text-xs text-secondary">{copy.wuwaText}</span>
          </span>
          <ExternalLink className="h-4 w-4 shrink-0 text-cyan" aria-hidden />
        </a>
        <a
          href={WA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 items-center gap-3 rounded-app border border-border bg-surface p-3 transition-colors hover:border-green-400/50"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#25D366]">
            <MessageCircle className="h-7 w-7 text-white" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block truncate text-sm text-primary">{copy.wa}</strong>
            <span className="mt-1 block text-xs text-secondary">{copy.waText}</span>
          </span>
          <span className="shrink-0 text-xs font-bold text-green-500">{copy.join}</span>
        </a>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 items-center gap-3 rounded-app border border-border bg-surface p-3 transition-colors hover:border-pink-400/50"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
            <Instagram className="h-7 w-7 text-white" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block truncate text-sm text-primary">{copy.instagram}</strong>
            <span className="mt-1 block text-xs text-secondary">{copy.instagramText}</span>
          </span>
          <ExternalLink className="h-4 w-4 shrink-0 text-pink-400" aria-hidden />
        </a>
      </div>
    </section>
  );
}
