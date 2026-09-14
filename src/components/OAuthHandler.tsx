'use client';
/**
 * OAuthHandler Component
 * 
 * Handles OAuth callback and shows loading screen
 * Prevents white screen after Google login
 */

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function OAuthHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Check if current URL is OAuth callback
    if (pathname.includes('__/auth/handler') || 
        window.location.href.includes('__/auth/handler')) {
      setIsProcessing(true);
      
      // Save return URL
      const returnUrl = sessionStorage.getItem('auth_return_url') || '/';
      
      // Wait for Firebase to process auth
      const timer = setTimeout(() => {
        sessionStorage.removeItem('auth_return_url');
        
        // Redirect to return URL
        router.replace(returnUrl);
      }, 2000);

      return () => clearTimeout(timer);
    }

    // Save current URL before OAuth (for return after login)
    if (!pathname.includes('__/auth/') && 
        !pathname.includes('/profile') &&
        typeof window !== 'undefined') {
      sessionStorage.setItem('auth_return_url', pathname);
    }
  }, [pathname, router]);

  // Show loading screen during OAuth processing
  if (isProcessing) {
    return (
      <div className="fixed inset-0 z-[9999] bg-bg flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan animate-spin mb-4" />
        <p className="text-lg font-semibold text-primary mb-2">
          Logging in...
        </p>
        <p className="text-sm text-secondary">
          Please wait while we complete your login
        </p>
      </div>
    );
  }

  return null;
}
