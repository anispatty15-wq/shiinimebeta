import { NextRequest, NextResponse } from 'next/server';

interface GiphyItem {
  id: string;
  title: string;
  url: string;
  preview: string;
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.GIPHY_API_KEY?.trim();
  const query = request.nextUrl.searchParams.get('q')?.trim() || 'anime';
  const offset = Math.max(0, Number(request.nextUrl.searchParams.get('offset') || 0));

  if (!apiKey) {
    return NextResponse.json({ error: 'GIPHY_API_KEY belum dikonfigurasi.' }, { status: 503 });
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    q: query.slice(0, 80),
    limit: '18',
    offset: String(Math.min(offset, 1000)),
    rating: 'pg-13',
    lang: 'en',
  });

  try {
    const response = await fetch(`https://api.giphy.com/v1/gifs/search?${params}`, { next: { revalidate: 60 } });
    const payload = await response.json() as { data?: Array<Record<string, unknown>>; pagination?: { total_count?: number; count?: number; offset?: number } };
    if (!response.ok) {
      return NextResponse.json({ error: 'GIPHY gagal mengambil hasil.' }, { status: response.status });
    }

    const results: GiphyItem[] = (payload.data ?? []).map((item) => {
      const images = item.images as Record<string, Record<string, string>> | undefined;
      const original = images?.original;
      const preview = images?.fixed_width?.url ?? images?.downsized?.url ?? original?.url ?? '';
      return {
        id: String(item.id ?? ''),
        title: String(item.title ?? 'GIF'),
        url: original?.url ?? preview,
        preview,
      };
    }).filter((item) => item.url && item.preview);

    return NextResponse.json({ results, pagination: payload.pagination ?? {} });
  } catch {
    return NextResponse.json({ error: 'Tidak dapat terhubung ke GIPHY.' }, { status: 502 });
  }
}
