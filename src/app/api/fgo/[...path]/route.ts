import { NextResponse } from 'next/server';

const ATLAS_ORIGIN = 'https://api.atlasacademy.io';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: routePath } = await context.params;
  const path = (routePath ?? []).join('/');
  if (path !== 'info' && !path.startsWith('nice/') && !path.startsWith('basic/') && !path.startsWith('raw/')) {
    return NextResponse.json({ error: 'Endpoint FGO tidak diizinkan.' }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const upstream = await fetch(`${ATLAS_ORIGIN}/${path}${new URL(request.url).search}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36',
        Referer: 'https://atlasacademy.io/',
        Origin: 'https://atlasacademy.io',
      },
      signal: controller.signal,
      cache: 'no-store',
    });
    const body = await upstream.arrayBuffer();
    return new NextResponse(body, {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('content-type') ?? 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Atlas Academy tidak tersedia.';
    return NextResponse.json({ error: message }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}