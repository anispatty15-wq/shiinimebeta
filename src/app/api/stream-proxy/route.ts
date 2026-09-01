// src/app/api/stream-proxy/route.ts
// ─────────────────────────────────────────────────────────────
// Server-side stream proxy.
//
// Handles two jobs:
//   1. IFRAME PROXY  — rewrites iframe HTML to bypass X-Frame-Options
//      GET /api/stream-proxy?url=https://nekopoi.care/embed/xxx
//      Returns the page HTML with X-Frame-Options stripped and
//      all relative URLs rewritten to absolute.
//
//   2. VIDEO/M3U8 PROXY  — pipes binary video/HLS streams
//      GET /api/stream-proxy?url=https://cdn.example.com/v.m3u8
//      Streams bytes through, rewrites .m3u8 segment URLs.
//
// All requests inject browser-like headers so sites don't block us.
// ─────────────────────────────────────────────────────────────

import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Headers that look like a real browser visiting the site
function browserHeaders(refererOrigin: string): Record<string, string> {
  return {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept':
      'text/html,application/xhtml+xml,application/xml;q=0.9,' +
      'video/webm,video/mp4,*/*;q=0.8',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer':         refererOrigin + '/',
    'Origin':          refererOrigin,
    'Cache-Control':   'no-cache',
    'Pragma':          'no-cache',
    'Sec-Fetch-Site':  'same-origin',
    'Sec-Fetch-Mode':  'navigate',
    'Sec-Fetch-Dest':  'iframe',
    'Sec-Ch-Ua':       '"Google Chrome";v="125", "Chromium";v="125"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
  };
}

// CORS headers to add to our responses
function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Range',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Range',
  };
}

// Rewrite all URLs in an M3U8 playlist to route through this proxy
function rewriteM3u8(content: string, baseUrl: string, proxyBase: string): string {
  const base = new URL(baseUrl);
  return content
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return line;
      // Relative segment URL
      try {
        const absoluteUrl = new URL(trimmed, base.href).href;
        return `${proxyBase}?url=${encodeURIComponent(absoluteUrl)}`;
      } catch {
        return line;
      }
    })
    .join('\n');
}

// Rewrite HTML — strip frame-busting headers and rewrite relative URLs
function rewriteHtml(html: string, targetOrigin: string, proxyBase: string): string {
  // Rewrite absolute URLs pointing to the same origin
  let out = html
    // Remove X-Frame-Options meta equiv
    .replace(/<meta[^>]+http-equiv=["']?x-frame-options["'][^>]*>/gi, '')
    // Remove CSP frame-ancestors meta
    .replace(/<meta[^>]+content=["'][^"']*frame-ancestors[^"']*["'][^>]*>/gi, '')
    // Inject base tag so relative resources resolve correctly
    .replace(
      /<head[^>]*>/i,
      `<head><base href="${targetOrigin}/">`
    );

  return out;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(req: NextRequest) {
  const targetUrl = req.nextUrl.searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json(
      { error: 'Missing "url" query parameter' },
      { status: 400, headers: corsHeaders() }
    );
  }

  // Validate URL
  let parsed: URL;
  try {
    parsed = new URL(decodeURIComponent(targetUrl));
  } catch {
    return NextResponse.json(
      { error: 'Invalid URL' },
      { status: 400, headers: corsHeaders() }
    );
  }

  const origin    = `${parsed.protocol}//${parsed.host}`;
  const proxyBase = `${req.nextUrl.origin}/api/stream-proxy`;

  try {
    // Forward Range header for video seeking
    const rangeHeader = req.headers.get('range');
    const upstreamHeaders: Record<string, string> = browserHeaders(origin);
    if (rangeHeader) upstreamHeaders['Range'] = rangeHeader;

    const response = await fetch(parsed.href, {
      headers:  upstreamHeaders,
      redirect: 'follow',
      signal:   req.signal,
    });

    const contentType = response.headers.get('content-type') ?? '';

    // ── M3U8 playlist ─────────────────────────────────────────
    if (
      contentType.includes('mpegurl') ||
      contentType.includes('x-mpegurl') ||
      parsed.pathname.endsWith('.m3u8')
    ) {
      const text    = await response.text();
      const rewritten = rewriteM3u8(text, parsed.href, proxyBase);
      return new NextResponse(rewritten, {
        status: response.status,
        headers: {
          'Content-Type':  'application/vnd.apple.mpegurl',
          'Cache-Control': 'no-store',
          ...corsHeaders(),
        },
      });
    }

    // ── HTML (iframe embed page) ───────────────────────────────
    if (contentType.includes('text/html')) {
      const html     = await response.text();
      const rewritten = rewriteHtml(html, origin, proxyBase);
      return new NextResponse(rewritten, {
        status: response.status,
        headers: {
          'Content-Type':    'text/html; charset=utf-8',
          // Critically: do NOT set X-Frame-Options so our iframe can embed it
          'Cache-Control':   'no-store',
          'Content-Security-Policy': "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;",
          ...corsHeaders(),
        },
      });
    }

    // ── Binary video / TS segment / MP4 ───────────────────────
    // Stream it directly (pipe through without buffering)
    const body = response.body;
    if (!body) {
      return new NextResponse(null, { status: 204, headers: corsHeaders() });
    }

    const resHeaders: Record<string, string> = {
      'Content-Type':  contentType || 'video/mp4',
      'Cache-Control': 'public, max-age=3600',
      ...corsHeaders(),
    };

    const contentLength = response.headers.get('content-length');
    if (contentLength) resHeaders['Content-Length'] = contentLength;

    const contentRange = response.headers.get('content-range');
    if (contentRange) resHeaders['Content-Range'] = contentRange;

    const acceptRanges = response.headers.get('accept-ranges');
    if (acceptRanges) resHeaders['Accept-Ranges'] = acceptRanges;

    return new NextResponse(body, {
      status:  response.status,
      headers: resHeaders,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Proxy upstream error';
    console.error('[stream-proxy]', msg);
    return NextResponse.json(
      { error: msg },
      { status: 502, headers: corsHeaders() }
    );
  }
}
