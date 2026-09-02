'use client';
// src/components/FloatingLinks.tsx
// Floating side buttons — kiri layar

import { useState } from 'react';
import { X, ExternalLink, MessageCircle } from 'lucide-react';
import { clsx } from 'clsx';

const WUWA_URL = 'https://wutheringwaves.kurogames.com/en/main';
const WA_URL   = 'https://chat.whatsapp.com/FRWb2JXmQx14u39x0yhshZ';

type Panel = 'wuwa' | 'wa' | null;

export default function FloatingLinks() {
  const [open,    setOpen]    = useState<Panel>(null);
  const [hidden,  setHidden]  = useState<Panel[]>([]);

  const toggle = (panel: Panel) => setOpen((v) => v === panel ? null : panel);
  const hide   = (panel: Panel) => { setHidden((p) => [...p, panel]); setOpen(null); };

  const wuwaHidden = hidden.includes('wuwa');
  const waHidden   = hidden.includes('wa');

  return (
    <div className="fixed left-0 bottom-28 z-[54] flex flex-col items-start gap-2.5 select-none">

      {/* ── Wuwa ── */}
      {!wuwaHidden && (
        <div className="flex items-center">

          {/* Popup */}
          <div className={clsx(
            'transition-all duration-300 ease-out overflow-hidden',
            open === 'wuwa' ? 'w-60 opacity-100' : 'w-0 opacity-0 pointer-events-none'
          )}>
            <div className="ml-1 bg-surface border border-border rounded-r-2xl shadow-2xl p-3.5 relative w-60">
              <button onClick={() => setOpen(null)}
                className="absolute top-2 right-2 w-5 h-5 rounded-full bg-surface-2 text-muted hover:text-primary flex items-center justify-center"
                aria-label="Tutup">
                <X className="w-3 h-3" />
              </button>
              <div className="flex items-center gap-2.5 mb-2.5 pr-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/wuwa.gif" alt="Wuwa" className="w-14 h-14 rounded-xl object-cover border border-border flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-primary">Wuthering Waves</p>
                  <p className="text-[0.65rem] text-muted">Tracker & Info</p>
                </div>
              </div>
              <p className="text-[0.7rem] text-secondary leading-relaxed mb-3">
                Cek banner aktif, tier list karakter, dan tracker progress kamu! ⚔️✨
              </p>
              <a href={WUWA_URL} target="_blank" rel="noopener noreferrer"
                onClick={() => setOpen(null)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-110 text-white text-xs font-bold transition-all shadow">
                <ExternalLink className="w-3.5 h-3.5" /> Buka Wuwa Tracker
              </a>
              <button onClick={() => hide('wuwa')}
                className="w-full text-center text-[0.6rem] text-muted/60 hover:text-muted mt-2 transition-colors">
                Sembunyikan
              </button>
            </div>
          </div>

          {/* Tab */}
          <button onClick={() => toggle('wuwa')}
            aria-label="Wuwa Tracker"
            className={clsx(
              'flex flex-col items-center justify-center gap-0.5 w-12 py-2 rounded-r-2xl',
              'border border-l-0 border-border shadow-lg transition-all',
              open === 'wuwa' ? 'bg-sky-500/20 border-sky-400/40' : 'bg-surface hover:bg-surface-2'
            )}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/wuwa.gif" alt="" aria-hidden
              className="w-9 h-9 rounded-lg object-cover" />
            <span className="text-[0.55rem] text-muted font-medium">Wuwa</span>
          </button>
        </div>
      )}

      {/* ── WhatsApp ── */}
      {!waHidden && (
        <div className="flex items-center">

          {/* Popup */}
          <div className={clsx(
            'transition-all duration-300 ease-out overflow-hidden',
            open === 'wa' ? 'w-60 opacity-100' : 'w-0 opacity-0 pointer-events-none'
          )}>
            <div className="ml-1 bg-surface border border-border rounded-r-2xl shadow-2xl p-3.5 relative w-60">
              <button onClick={() => setOpen(null)}
                className="absolute top-2 right-2 w-5 h-5 rounded-full bg-surface-2 text-muted hover:text-primary flex items-center justify-center"
                aria-label="Tutup">
                <X className="w-3 h-3" />
              </button>
              <div className="flex items-center gap-2.5 mb-2.5 pr-5">
                {/* WhatsApp logo */}
                <div className="w-14 h-14 rounded-xl bg-[#25D366] flex items-center justify-center flex-shrink-0 shadow">
                  <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white" aria-hidden>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">Komunitas WA</p>
                  <p className="text-[0.65rem] text-muted">Shiinime Group</p>
                </div>
              </div>
              <p className="text-[0.7rem] text-secondary leading-relaxed mb-3">
                Gabung komunitas WhatsApp Shiinime! Diskusi anime, update terbaru, dan lebih banyak lagi! 🎌
              </p>
              <a href={WA_URL} target="_blank" rel="noopener noreferrer"
                onClick={() => setOpen(null)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs font-bold transition-all shadow">
                <MessageCircle className="w-3.5 h-3.5" /> Gabung Sekarang
              </a>
              <button onClick={() => hide('wa')}
                className="w-full text-center text-[0.6rem] text-muted/60 hover:text-muted mt-2 transition-colors">
                Sembunyikan
              </button>
            </div>
          </div>

          {/* Tab */}
          <button onClick={() => toggle('wa')}
            aria-label="Komunitas WhatsApp"
            className={clsx(
              'flex flex-col items-center justify-center gap-0.5 w-12 py-2 rounded-r-2xl',
              'border border-l-0 border-border shadow-lg transition-all',
              open === 'wa' ? 'bg-[#25D366]/20 border-[#25D366]/40' : 'bg-surface hover:bg-surface-2'
            )}>
            <div className="w-9 h-9 rounded-lg bg-[#25D366] flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <span className="text-[0.55rem] text-muted font-medium">WA</span>
          </button>
        </div>
      )}

    </div>
  );
}
