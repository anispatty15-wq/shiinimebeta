// src/app/api/admin-setup/route.ts
// ONE-TIME setup route — sets admin role on a specific UID.
// DELETE this file after use!
// Usage: GET /api/admin-setup?uid=YOUR_UID&secret=shiinime-setup-2026

import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const uid    = searchParams.get('uid');
  const secret = searchParams.get('secret');

  if (secret !== 'shiinime-setup-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!uid) {
    return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
  }

  // This needs Firebase Admin SDK — skip if not configured
  // For now, return the manual instructions
  return NextResponse.json({
    message: 'Gunakan Firebase Console untuk edit manual:',
    steps: [
      `1. Buka Firestore → users → ${uid}`,
      '2. Edit field "roles" → hapus semua → Add value "user" → Add value "18+"',
      '3. Edit field "adultStatus" → ganti ke "approved"',
      '4. Edit field "isAdmin" → set ke true (boolean)',
      '5. Logout dari Shiinime lalu login ulang',
    ],
    uid,
  });
}
