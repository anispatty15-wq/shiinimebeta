// src/app/api/stream-proxy/route.ts
// ─────────────────────────────────────────────────────────────
// Server-side stream proxy.
//
// Modes:
//   1. ?url=URL             → proxy HTML/video/m3u8 through
//   2. ?url=URL&extract=1   → extract embed iframe src from HTML page
//      Returns JSON: { embedUrl: "https://..." }
// ─────────────────────────────────────────────────────────────

import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function browserHeaders(refererOrigin: string): Record<string, string> {
  return {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept':
      'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8',
    'Referer':         refererOrigin + '/',
    'Origin':          refererOrigin,
    'Cache-Control':   'no-cache',
    'Sec-Fetch-Site':  'same-origin',
    'Sec-Fetch-Mode':  'navigate',
    'Sec-Fetch-Dest':  'document',
  };
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin':   '*',
    'Access-Control-Allow-Methods':  'GET, OPTIONS',
    'Access-Control-Allow-Headers':  'Content-Type, Range',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Range',
  };
}

// ── Extract embed URL from HTML ───────────────────────────────
// Tries multiple patterns used by nekopoi / streaming sites
function extractEmbedUrl(html: string, baseOrigin: string): string | null {
  const patterns = [
    // Standard iframe src
    /(?:<iframe[^>]+src=["'])([^"']+(?:embed|player|watch|stream|vid)[^"']*)["']/i,
    // Any iframe with video-like src
    /(?:<iframe[^>]+src=["'])([^"']*(?:nekopoi|stream|hxfile|filelions|vidmoly|doodstream|streamtape|mp4upload|userload|gofile|upstream)[^"']*)["']/i,
    // Video source tag
    /<source[^>]+src=["']([^"']+\.(?:mp4|m3u8|webm)[^"']*)["']/i,
    // JavaScript variable containing video URL
    /(?:file|src|url|source)\s*[=:]\s*["']([^"']+(?:\.mp4|\.m3u8|embed|player)[^"']*)["']/i,
    // data-src on iframe
    /(?:<iframe[^>]+data-src=["'])([^"']+)["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      const url = match[1].trim();
      // Make absolute if relative
      if (url.startsWith('//')) return `https:${url}`;
      if (url.startsWith('/'))  return `${baseOrigin}${url}`;
      if (url.startsWith('http')) return url;
    }
  }
  return null;
}

function rewriteM3u8(content: string, baseUrl: string, proxyBase: string): string {
  const base = new URL(baseUrl);
  return content
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return line;
      try {
        const absoluteUrl = new URL(trimmed, base.href).href;
        return `${proxyBase}?url=${encodeURIComponent(absoluteUrl)}`;
      } catch { return line; }
    })
    .join('\n');
}

function rewriteHtml(html: string, targetOrigin: string): string {
  return html
    .replace(/<meta[^>]+http-equiv=["']?x-frame-options["'][^>]*>/gi, '')
    .replace(/<meta[^>]+content=["'][^"']*frame-ancestors[^"']*["'][^>]*>/gi, '')
    .replace(/<head[^>]*>/i, `<head><base href="${targetOrigin}/">`);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(req: NextRequest) {
  const targetUrl = req.nextUrl.searchParams.get('url');
  const extract   = req.nextUrl.searchParams.get('extract') === '1';

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing url param' }, { status: 400, headers: corsHeaders() });
  }

  let parsed: URL;
  try {
    parsed = new URL(decodeURIComponent(targetUrl));
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400, headers: corsHeaders() });
  }

  const origin    = `${parsed.protocol}//${parsed.host}`;
  const proxyBase = `${req.nextUrl.origin}/api/stream-proxy`;

  try {
    const rangeHeader = req.headers.get('range');
    const headers: Record<string, string> = browserHeaders(origin);
    if (rangeHeader) headers['Range'] = rangeHeader;

    const response = await fetch(parsed.href, {
      headers,
      redirect: 'follow',
      signal:   AbortSignal.timeout(15_000),
    });

    const contentType = response.headers.get('content-type') ?? '';

    // ── Extract mode: parse HTML and find embed URL ───────────
    if (extract && contentType.includes('text/html')) {
      const html     = await response.text();
      const embedUrl = extractEmbedUrl(html, origin);

      if (embedUrl) {
        return NextResponse.json({ embedUrl }, {
          headers: { ...corsHeaders(), 'Cache-Control': 'no-store' },
        });
      }

      // Fallback: return proxy URL of original page
      return NextResponse.json({
        embedUrl: null,
        proxyUrl: `${proxyBase}?url=${encodeURIComponent(parsed.href)}`,
        debug: 'No embed found, use proxyUrl as fallback',
      }, { headers: corsHeaders() });
    }

    // ── M3U8 ──────────────────────────────────────────────────
    if (contentType.includes('mpegurl') || parsed.pathname.endsWith('.m3u8')) {
      const text = await response.text();
      return new NextResponse(rewriteM3u8(text, parsed.href, proxyBase), {
        status: response.status,
        headers: { 'Content-Type': 'application/vnd.apple.mpegurl', 'Cache-Control': 'no-store', ...corsHeaders() },
      });
    }

    // ── HTML (proxy mode) ─────────────────────────────────────
    if (contentType.includes('text/html')) {
      const html = await response.text();
      return new NextResponse(rewriteHtml(html, origin), {
        status: response.status,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
          'Content-Security-Policy': "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;",
          ...corsHeaders(),
        },
      });
    }

    // ── Binary (video/TS/MP4) ─────────────────────────────────
    const body = response.body;
    if (!body) return new NextResponse(null, { status: 204, headers: corsHeaders() });

    const resHeaders: Record<string, string> = {
      'Content-Type':  contentType || 'video/mp4',
      'Cache-Control': 'public, max-age=3600',
      ...corsHeaders(),
    };
    const cl = response.headers.get('content-length');
    const cr = response.headers.get('content-range');
    const ar = response.headers.get('accept-ranges');
    if (cl) resHeaders['Content-Length'] = cl;
    if (cr) resHeaders['Content-Range']  = cr;
    if (ar) resHeaders['Accept-Ranges']  = ar;

    return new NextResponse(body, { status: response.status, headers: resHeaders });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Proxy error';
    console.error('[stream-proxy]', msg);
    return NextResponse.json({ error: msg }, { status: 502, headers: corsHeaders() });
  }
}
