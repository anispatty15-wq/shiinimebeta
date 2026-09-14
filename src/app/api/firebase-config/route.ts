// src/app/api/firebase-config/route.ts
// Serves Firebase client config from server-side env vars.
// Values are NOT in NEXT_PUBLIC_ so they don't appear in JS bundles.
// The endpoint itself is public (needed for client SDK init).

import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
    apiKey:            process.env.FIREBASE_API_KEY            ?? '',
    authDomain:        process.env.FIREBASE_AUTH_DOMAIN        ?? '',
    projectId:         process.env.FIREBASE_PROJECT_ID         ?? '',
    storageBucket:     process.env.FIREBASE_STORAGE_BUCKET     ?? '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId:             process.env.FIREBASE_APP_ID             ?? '',
  };

  // Don't serve if not configured
  if (!config.apiKey) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  return NextResponse.json(config, {
    headers: {
      // Cache 1 hour — config rarely changes
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
