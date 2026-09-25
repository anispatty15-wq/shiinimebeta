'use client';

import { useParams, useRouter } from 'next/navigation';
import WatchPartyRoom from '@/components/WatchPartyRoom';

export default function WatchPartyRoomPage() {
  const params = useParams<{ roomId: string | string[] }>();
  const roomId = Array.isArray(params.roomId) ? params.roomId[0] : params.roomId;
  const router = useRouter();
  return <WatchPartyRoom roomId={roomId} onLeave={() => router.push('/nobar')} />;
}