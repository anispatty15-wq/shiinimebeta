'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { MaidGenrePage } from '@/components/MaidComicListPage';

function GenreContent() {
  const { slug } = useParams<{ slug: string }>();
  return <MaidGenrePage slug={decodeURIComponent(slug ?? '')} />;
}

export default function MaidGenreRoute() {
  return <Suspense fallback={null}><GenreContent /></Suspense>;
}
