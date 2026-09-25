'use client';

import { useParams } from 'next/navigation';
import WatchPartyRoom from '@/components/WatchPartyRoom';

export default function WatchPartyRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  return <WatchPartyRoom roomId={roomId} />;
}