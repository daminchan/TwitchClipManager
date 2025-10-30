import { NextRequest, NextResponse } from 'next/server';
import { getClipsByBroadcaster } from '@/lib/twitch-api';
import { DEFAULT_TIME_RANGE_DAYS } from '@/lib/constants';

/**
 * GET /api/twitch/clips?broadcasterId=...&days=7
 * 配信者のクリップを取得（人気順）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const broadcasterId = searchParams.get('broadcasterId');
    const daysParam = searchParams.get('days');

    if (!broadcasterId) {
      return NextResponse.json(
        { error: 'broadcasterId is required' },
        { status: 400 }
      );
    }

    // 日数指定がある場合は期間を設定
    const days = daysParam ? parseInt(daysParam, 10) : DEFAULT_TIME_RANGE_DAYS;
    const endedAt = new Date();
    const startedAt = new Date();
    startedAt.setDate(startedAt.getDate() - days);

    const clips = await getClipsByBroadcaster(broadcasterId, {
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
    });

    return NextResponse.json({ data: clips });
  } catch (error) {
    console.error('Error fetching clips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clips', details: String(error) },
      { status: 500 }
    );
  }
}
