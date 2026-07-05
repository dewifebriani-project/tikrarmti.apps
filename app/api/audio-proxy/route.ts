import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const audioUrl = searchParams.get('url');

    if (!audioUrl) {
      return new Response('Missing url parameter', { status: 400 });
    }

    // Security: Only allow proxying from our own Supabase storage URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && !audioUrl.startsWith(supabaseUrl)) {
      return new Response('Unauthorized audio origin', { status: 403 });
    }

    const response = await fetch(audioUrl);
    if (!response.ok) {
      return new Response(`Failed to fetch audio: ${response.statusText}`, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'audio/webm';
    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Audio proxy error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
