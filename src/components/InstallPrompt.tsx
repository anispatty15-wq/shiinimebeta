'use client';
/**
 * InstallPrompt Component
 * 
 * Shows a prompt to install the app (Add to Home Screen)
 */

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem('install-prompt-dismissed');
    if (dismissed === 'true') {
      return;
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show install prompt after 10 seconds
      setTimeout(() => {
        setShowPrompt(true);
      }, 10000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowPrompt(false);
    localStorage.setItem('install-prompt-dismissed', 'true');
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('install-prompt-dismissed', 'true');
  };

  if (!showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-surface border border-border rounded-app shadow-modal p-4 relative">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded text-muted hover:text-primary transition-colors"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="w-12 h-12 rounded-app bg-violet/10 flex items-center justify-center mb-3">
          <Download className="w-6 h-6 text-violet" />
        </div>

        {/* Content */}
        <h3 className="text-base font-semibold text-primary mb-1">
          Install Shiiinime
        </h3>
        <p className="text-sm text-secondary mb-4">
          Install aplikasi ke home screen untuk akses cepat dan notifikasi push!
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleInstall}
            className="btn-violet flex-1 text-sm py-2"
          >
            <Download className="w-4 h-4" />
            Install Sekarang
          </button>
          <button
            onClick={handleDismiss}
            className="btn-ghost text-sm py-2 px-3"
          >
            Nanti
          </button>
        </div>
      </div>
    </div>
  );
}
