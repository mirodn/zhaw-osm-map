import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  if (!q) return NextResponse.json({ error: 'missing q' }, { status: 400 });

  const url =
    'https://nominatim.openstreetmap.org/search?' +
    new URLSearchParams({ q, format: 'json', limit: '1', addressdetails: '0' });

  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'ZHAW-Map/1.0 (contact: you@example.com)' },
      // wichtig für Vercel/Edge: 
      next: { revalidate: 60 }, // simple caching
    });
    const data = await resp.json();
    if (!Array.isArray(data) || data.length === 0)
      return NextResponse.json({ lat: null, lon: null, ok: false });
    const item = data[0];
    return NextResponse.json({
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      ok: true,
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
