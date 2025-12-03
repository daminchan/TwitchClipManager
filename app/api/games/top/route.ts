/**
 * 人気ゲーム一覧取得 API Route
 *
 * 適用スキル: api-creator
 * 適用ルール:
 * - CLAUDE.md セクション6: API設計原則
 * - オンボーディングフロー設計.md: ゲーム選択機能
 *
 * 理由:
 * - ユーザーのゲーム選択時に人気Top 50ゲームを表示
 * - Twitch APIで視聴者数順にソート済み
 * - React Queryで10分間キャッシュ（人気ゲームはそう変わらない）
 */

import { NextResponse } from 'next/server';
import { getTopGames } from '@/lib/twitch-api';

export async function GET() {
  try {
    // 人気Top 50ゲームを取得
    const games = await getTopGames(50);

    return NextResponse.json(
      { data: games },
      {
        headers: {
          // 公開キャッシュ（全ユーザー共通）
          // 10分間ブラウザキャッシュ
          'Cache-Control': 'public, max-age=600, s-maxage=600',
        },
      }
    );
  } catch (error) {
    console.error('Get top games error:', error);

    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }

    return NextResponse.json(
      {
        error: 'ゲーム一覧の取得に失敗しました',
        code: 'FETCH_FAILED'
      },
      { status: 500 }
    );
  }
}
