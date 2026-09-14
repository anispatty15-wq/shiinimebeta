'use client';

import { Suspense } from 'react';
import { MaidSearchPage } from '@/components/MaidComicListPage';

export default function MaidSearchRoute() {
  return <Suspense fallback={null}><MaidSearchPage /></Suspense>;
}
