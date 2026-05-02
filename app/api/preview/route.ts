import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    const html = await response.text();
    const $ = cheerio.load(html);

    // Open Graph 데이터 추출
    const preview = {
      title: $('meta[property="og:title"]').attr('content') || $('title').text() || url,
      description: $('meta[property="og:description"]').attr('content') || '',
      image: $('meta[property="og:image"]').attr('content') || '',
      url: url
    };

    return NextResponse.json(preview);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch preview' }, { status: 500 });
  }
}