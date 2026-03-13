export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WartWallet-Mobile/1.0'
      },
      cache: 'no-store',
      signal: controller.signal
    });

    clearTimeout(id);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Remote server responded with ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Proxy Error:", error.message);

    if (error.name === 'AbortError') {
      return NextResponse.json({ error: 'Remote server timeout' }, { status: 504 });
    }

    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}