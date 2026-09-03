// src/app/api/proxy/[...path]/route.ts
// ─────────────────────────────────────────────────────────────
// Server-side reverse proxy.
// ALL API calls are routed through here from the browser so:
//   1. The real IP never hits the target API directly
//   2. Node.js can set proper User-Agent / Referer headers
//   3. CORS is avoided entirely
// ─────────────────────────────────────────────────────────────

import { type NextRequest, NextResponse } from 'next/server';

// API Origins - route based on path prefix
const ANIME_API = 'https://www.sankavollerei.web.id';
const DONGHUA_API = 'https://api.shiiinime.my.id';

// Determine target API based on path
function getTargetOrigin(pathStr: string): string {
  // If path starts with anime/donghua, route to donghua API
  if (pathStr.startsWith('anime/donghua')) {
    return DONGHUA_API;
  }
  // Default to anime API
  return ANIME_API;
}

// Build headers for upstream request based on target
function buildUpstreamHeaders(targetOrigin: string): Record<string, string> {
  return {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept':          'application/json, text/html, */*',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer':         `${targetOrigin}/`,
    'Origin':          targetOrigin,
    'Cache-Control':   'no-cache',
    'Pragma':          'no-cache',
    'Connection':      'keep-alive',
    // Mimic a real browser session cookie jar presence
    'Sec-Fetch-Site':  'same-origin',
    'Sec-Fetch-Mode':  'cors',
    'Sec-Fetch-Dest':  'empty',
    'Sec-Ch-Ua':       '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
  };
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, context);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, context);
}

export const dynamic = 'force-dynamic';

// ── Core proxy function ───────────────────────────────────────
async function proxyRequest(
  req:     NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  try {
    // Next.js 14 App Router: params is a Promise
    const { path } = await context.params;
    const pathStr  = (path ?? []).join('/');
    
    // Determine which API to use based on path
    const targetOrigin = getTargetOrigin(pathStr);
    
    const search   = req.nextUrl.search ?? '';
    const upstream = `${targetOrigin}/${pathStr}${search}`;

    // Build headers — start with our injected set
    const headers: Record<string, string> = buildUpstreamHeaders(targetOrigin);

    // Forward a few safe headers from the incoming request
    const forwarded = ['accept', 'accept-language'];
    forwarded.forEach((h) => {
      const v = req.headers.get(h);
      if (v) headers[h] = v;
    });

    // If the client sent a cookie (after first successful visit), forward it
    const cookie = req.headers.get('cookie');
    if (cookie) headers['Cookie'] = cookie;

    // Log the request for debugging (only in development)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[proxy] ${req.method} ${upstream}`);
    }

    // Fetch from the real target (runs on Node.js server)
    const response = await fetch(upstream, {
      method:   req.method ?? 'GET',
      headers,
      redirect: 'follow',
      signal:   req.signal,
    });

    const contentType = response.headers.get('content-type') ?? 'application/json';
    const body        = await response.arrayBuffer(); // binary-safe

    // Forward Set-Cookie so the server can remember us
    const setCookie = response.headers.get('set-cookie');
    const resHeaders: Record<string, string> = {
      'Content-Type':                  contentType,
      ...corsHeaders(),
      'Cache-Control': response.ok
        ? 'public, s-maxage=30, stale-while-revalidate=15'
        : 'no-store',
    };
    if (setCookie) resHeaders['Set-Cookie'] = setCookie;

    return new NextResponse(body, {
      status:  response.status,
      headers: resHeaders,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Upstream fetch failed';
    console.error('[proxy] error:', msg);
    return NextResponse.json(
      { error: msg },
      { status: 502, headers: corsHeaders() }
    );
  }
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
  };
}
