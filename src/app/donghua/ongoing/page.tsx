'use client';
import { useCallback } from 'react';
import { DonghuaAPI } from '@/lib/api';
import DonghuaListPage from '@/components/DonghuaListPage';
export default function Page() {
  return <DonghuaListPage title="Donghua Ongoing" fetcher={useCallback((page: number) => DonghuaAPI.getOngoing(page), [])} />;
}
