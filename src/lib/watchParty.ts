export type WatchPartyVisibility = 'public' | 'private';

export interface WatchPartyRoom {
  id: string;
  hostId: string;
  hostName: string;
  title: string;
  episodeSlug: string;
  streamUrl: string;
  visibility: WatchPartyVisibility;
  passwordHash?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WatchPartyMember {
  uid: string;
  displayName: string;
  photoURL?: string;
  joinedAt?: Date;
  voiceEnabled?: boolean;
}

export async function hashWatchPartyPassword(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function createWatchPartyId(): string {
  return crypto.randomUUID().replaceAll('-', '').slice(0, 16);
}