'use client';
// src/app/profile/page.tsx
// Redirect to /profile/[uid] page

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ProfileRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    
    if (user) {
      // Redirect to own profile
      router.replace(`/profile/${user.uid}`);
    } else {
      // Not logged in - redirect to home
      router.replace('/');
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-cyan animate-spin mx-auto mb-4" />
        <p className="text-sm text-muted">Loading profile...</p>
      </div>
    </div>
  );
}
