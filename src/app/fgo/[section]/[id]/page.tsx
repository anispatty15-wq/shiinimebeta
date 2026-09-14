'use client';

import { useEffect, useState } from 'react';
import FgoDetailPage from '@/components/FgoDetailPage';
import type { FgoRegion } from '@/lib/fgoApi';

export default function FgoSectionDetailPage({ params }: { params: { section: string; id: string } }) {
  const [region, setRegion] = useState<FgoRegion>('JP');
  useEffect(() => { const saved = localStorage.getItem('fgo-region') as FgoRegion | null; if (saved === 'JP' || saved === 'NA') setRegion(saved); }, []);
  return <FgoDetailPage section={params.section} id={params.id} region={region} />;
}