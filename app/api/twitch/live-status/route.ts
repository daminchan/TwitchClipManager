// 適用スキル: api-creator
// 適用ルール:
// - セクション4.3: 関数命名規則（camelCase）
// - セクション7.1: エラーハンドリング
// - セクション11: Twitch API連携

import { NextRequest, NextResponse } from 'next/server';
import { getStreamsStatus } from '@/lib/twitch-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');

    if (!ids) {
      return NextResponse.json({ error: 'Broadcaster IDs are required' }, { status: 400 });
    }

    const broadcasterIds = ids.split(',').filter((id) => id.trim().length > 0);

    if (broadcasterIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const liveStreams = await getStreamsStatus(broadcasterIds);

    return NextResponse.json({ data: liveStreams });
  } catch (error) {
    console.error('Live status API error:', error);
    return NextResponse.json({ error: 'Failed to fetch live status' }, { status: 500 });
  }
}
