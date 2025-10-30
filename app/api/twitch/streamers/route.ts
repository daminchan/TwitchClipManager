import { NextRequest, NextResponse } from 'next/server';
import { searchStreamers } from '@/lib/twitch-api';

/**
 * GET /api/twitch/streamers?query=...
 * 配信者を検索
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    const streamers = await searchStreamers(query);

    return NextResponse.json({ data: streamers });
  } catch (error) {
    console.error('Error searching streamers:', error);
    return NextResponse.json(
      { error: 'Failed to search streamers', details: String(error) },
      { status: 500 }
    );
  }
}
