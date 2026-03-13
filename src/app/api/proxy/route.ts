import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // decodeURIComponent siguron që URL-ja të jetë e pastër (pa %20, %3A etj.)
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Shtojmë një timeout të brendshëm që serveri mos të bllokojë të gjithë app-in
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 8000); // 8 sekonda max

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'WartWallet-Mobile/1.0' // I jep një identitet kërkesës
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
    
    // Nëse është timeout
    if (error.name === 'AbortError') {
      return NextResponse.json({ error: 'Remote server timeout' }, { status: 504 });
    }

    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}