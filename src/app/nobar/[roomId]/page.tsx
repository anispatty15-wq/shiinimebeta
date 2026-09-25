'use client';

import { useParams, useRouter } from 'next/navigation';
import WatchPartyRoom from '@/components/WatchPartyRoom';

export default function WatchPartyRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();
  return <WatchPartyRoom roomId={roomId} onLeave={() => router.push('/nobar')} />;
}