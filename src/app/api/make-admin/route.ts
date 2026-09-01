// src/app/api/make-admin/route.ts
// ONE-TIME setup: creates admin doc in Firestore for a given UID
// DELETE this file after use!
//
// Usage (after deploy):
//   GET /api/make-admin?uid=YOUR_UID&secret=shiinime2026

import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const SECRET = 'shiinime2026';

export async function GET(req: NextRequest) {
  const uid    = req.nextUrl.searchParams.get('uid');
  const secret = req.nextUrl.searchParams.get('secret');

  if (secret !== SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!uid) {
    return NextResponse.json({ error: 'Missing uid param' }, { status: 400 });
  }

  // Need Firebase Admin service account
  // Check if FIREBASE_SERVICE_ACCOUNT env is set
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountJson) {
    return NextResponse.json({
      error: 'FIREBASE_SERVICE_ACCOUNT not set',
      manual_steps: [
        `1. Buka Firebase Console → Firestore → Data`,
        `2. Klik "Start collection" → ID: admins`,
        `3. Document ID: ${uid}`,
        `4. Add field: email (string) → isi email kamu`,
        `5. Save`,
        `6. Logout dari Shiinime lalu login ulang`,
      ],
    }, { status: 503 });
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    if (!getApps().find((a) => a.name === 'admin')) {
      initializeApp({ credential: cert(serviceAccount) }, 'admin');
    }
    const db = getFirestore('admin');

    // Create admin doc
    await db.collection('admins').doc(uid).set({
      uid,
      createdAt: new Date().toISOString(),
    });

    // Update user doc
    await db.collection('users').doc(uid).update({
      isAdmin:     true,
      roles:       ['user', '18+'],
      adultStatus: 'approved',
    });

    return NextResponse.json({
      success: true,
      message: `UID ${uid} is now admin. Logout dan login ulang di Shiinime.`,
    });
  } catch (err: unknown) {
    return NextResponse.json({
      error:  err instanceof Error ? err.message : String(err),
      manual_steps: [
        `1. Buka Firebase Console → Firestore → Data`,
        `2. Klik "Start collection" → ID: admins`,
        `3. Document ID: ${uid}`,
        `4. Add field: email (string)`,
        `5. Save, lalu logout dan login ulang`,
      ],
    }, { status: 500 });
  }
}
