/**
 * Twitch ライブステータス取得 API Route
 *
 * 適用スキル: api-creator
 * 適用ルール:
 * - CLAUDE.md セクション6: API設計原則
 * - API Routes: 読み取り操作でキャッシュが重要
 *
 * 理由:
 * - ライブステータスは複数ユーザーで共有可能（短時間キャッシュ）
 * - リアルタイム性とパフォーマンスのバランス（30秒キャッシュ）
 * - Rate Limit 対策
 */

import { NextResponse } from 'next/server';
import { getStreamsStatus } from '@/lib/twitch-api';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');

    // バリデーション
    if (!idsParam || idsParam.trim().length === 0) {
      return NextResponse.json(
        { error: '配信者IDが必要です', code: 'MISSING_IDS' },
        { status: 400 }
      );
    }

    // カンマ区切りのIDを配列に変換
    const broadcasterIds = idsParam.split(',').filter((id) => id.trim().length > 0);

    if (broadcasterIds.length === 0) {
      return NextResponse.json(
        { error: '有効な配信者IDが必要です', code: 'INVALID_IDS' },
        { status: 400 }
      );
    }

    if (broadcasterIds.length > 100) {
      return NextResponse.json(
        { error: '一度に取得できる配信者は100人までです', code: 'TOO_MANY_IDS' },
        { status: 400 }
      );
    }

    // Twitch API からライブステータスを取得
    const liveStreams = await getStreamsStatus(broadcasterIds);

    // 成功レスポンス（短時間キャッシュ）
    return NextResponse.json(
      { data: liveStreams },
      {
        headers: {
          // 30秒間キャッシュ（リアルタイム性とパフォーマンスのバランス）
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('Twitch live status error:', error);

    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }

    return NextResponse.json(
      {
        error: 'ライブステータスの取得に失敗しました',
        code: 'FETCH_FAILED'
      },
      { status: 500 }
    );
  }
}
