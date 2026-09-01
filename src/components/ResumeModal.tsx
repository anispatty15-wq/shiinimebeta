'use client';
// src/components/ResumeModal.tsx
// Glassmorphism resume modal with backdrop-blur

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Play, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';

interface ResumeModalProps {
  open:          boolean;
  onClose:       () => void;
  icon?:         string;
  title:         string;
  subtitle?:     string;
  /** Bold highlighted value (e.g. "1:23" or "Halaman 5") */
  highlight:     string;
  continueLabel: string;
  restartLabel:  string;
  onContinue:    () => void;
  onRestart:     () => void;
}

export default function ResumeModal({
  open,
  onClose,
  icon,
  title,
  subtitle,
  highlight,
  continueLabel,
  restartLabel,
  onContinue,
  onRestart,
}: ResumeModalProps) {
  const firstBtnRef = useRef<HTMLButtonElement>(null);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Focus first button
  useEffect(() => {
    if (open) setTimeout(() => firstBtnRef.current?.focus(), 60);
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  const handleContinue = () => { onClose(); onContinue(); };
  const handleRestart  = () => { onClose(); onRestart();  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-modal-title"
      className="fixed inset-0 z-[9000] flex items-center justify-center p-5 animate-fade-up"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={clsx(
          'relative z-10 w-full max-w-[340px] animate-scale-in',
          'bg-surface border border-white/10 rounded-app px-6 py-6 shadow-modal',
          'overflow-hidden'
        )}
      >
        {/* Accent top bar */}
        <div className="absolute top-0 left-6 right-6 h-[2px] rounded-b bg-gradient-to-r from-cyan to-violet" />

        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Tutup"
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full flex items-center justify-center bg-white/6 text-muted hover:bg-white/12 hover:text-primary transition-colors"
        >
          <X className="w-3.5 h-3.5" aria-hidden />
        </button>

        {/* Icon */}
        {icon && (
          <div className="w-11 h-11 rounded-xl bg-cyan/10 flex items-center justify-center mb-3.5 text-xl">
            <span aria-hidden>{icon}</span>
          </div>
        )}

        {/* Title */}
        <h2
          id="resume-modal-title"
          className="text-[0.95rem] font-bold text-primary mb-1"
        >
          {title}
        </h2>

        {subtitle && (
          <p className="text-xs text-secondary leading-relaxed mb-1">{subtitle}</p>
        )}

        <p className="text-base font-semibold text-cyan mb-5">{highlight}</p>

        {/* Actions */}
        <div className="flex gap-2.5">
          <button
            ref={firstBtnRef}
            onClick={handleContinue}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2',
              'bg-cyan text-bg rounded-app px-3 py-2.5 text-sm font-bold',
              'shadow-glow-c hover:brightness-110 active:scale-[0.97] transition-all'
            )}
          >
            <Play className="w-3.5 h-3.5 fill-current" aria-hidden />
            {continueLabel}
          </button>
          <button
            onClick={handleRestart}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2',
              'bg-white/8 border border-border text-primary',
              'rounded-app px-3 py-2.5 text-sm font-semibold',
              'hover:bg-white/12 active:scale-[0.97] transition-all'
            )}
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden />
            {restartLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
