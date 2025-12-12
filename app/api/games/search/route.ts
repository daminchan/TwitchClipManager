/**
 * ゲーム検索 API Route
 *
 * 適用スキル: api-creator
 * 適用ルール:
 * - CLAUDE.md セクション6: API設計原則
 *
 * 理由:
 * - Twitch APIの /search/categories を使用してゲームを検索
 * - 人気ゲーム一覧に含まれないゲームも検索可能にする
 */

import { NextResponse } from 'next/server';
import { searchGames } from '@/lib/twitch-api';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    console.log('[Game Search] Query:', query);

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: '検索クエリが必要です', code: 'MISSING_QUERY' },
        { status: 400 }
      );
    }

    const games = await searchGames(query.trim(), 20);

    console.log('[Game Search] Results count:', games?.length ?? 0);

    return NextResponse.json({ data: games });
  } catch (error) {
    console.error('[Game Search] Error:', error);

    if (error instanceof Error) {
      console.error('[Game Search] Error details:', error.message, error.stack);
    }

    return NextResponse.json(
      {
        error: 'ゲームの検索に失敗しました',
        code: 'SEARCH_FAILED'
      },
      { status: 500 }
    );
  }
}
