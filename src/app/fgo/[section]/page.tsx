'use client';

import { useEffect, useState } from 'react';
import FgoDatabasePage from '@/components/FgoDatabasePage';
import type { FgoRegion } from '@/lib/fgoApi';

export default function FgoSectionPage({ params }: { params: { section: string } }) {
  const [region, setRegion] = useState<FgoRegion>('JP');
  useEffect(() => { const saved = localStorage.getItem('fgo-region') as FgoRegion | null; if (saved === 'JP' || saved === 'NA') setRegion(saved); }, []);
  return <FgoDatabasePage section={params.section} region={region} onRegionChange={setRegion} />;
}