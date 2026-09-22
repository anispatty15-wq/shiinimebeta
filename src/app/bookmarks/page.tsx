'use client';
// Redirect shim — /bookmarks → /favorites
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BookmarksRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/favorites'); }, [router]);
  return null;
}
