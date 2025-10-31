/**
 * Twitch 配信者検索 API Route
 *
 * 適用スキル: api-creator
 * 適用ルール:
 * - CLAUDE.md セクション6: API設計原則
 * - API Routes: 読み取り操作でキャッシュが重要
 *
 * 理由:
 * - 検索結果は全ユーザーで共有可能（キャッシュ効果大）
 * - 配信者情報は頻繁に変わらない（長時間キャッシュOK）
 * - 認証不要（誰でも検索可能）
 */

import { NextResponse } from 'next/server';
import { searchStreamers } from '@/lib/twitch-api';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    // バリデーション
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: '検索クエリが必要です', code: 'MISSING_QUERY' },
        { status: 400 }
      );
    }

    if (query.trim().length > 100) {
      return NextResponse.json(
        { error: '検索クエリが長すぎます', code: 'QUERY_TOO_LONG' },
        { status: 400 }
      );
    }

    // Twitch API から配信者を検索
    const streamers = await searchStreamers(query.trim());

    // 成功レスポンス（キャッシュヘッダー付き）
    return NextResponse.json(
      { data: streamers },
      {
        headers: {
          // ブラウザ: 5分間キャッシュ
          // CDN: 1時間キャッシュ、最大2時間は古いキャッシュを提供可能
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (error) {
    console.error('Twitch search error:', error);

    // Twitch API エラーの詳細をログに記録
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }

    return NextResponse.json(
      {
        error: '配信者の検索に失敗しました',
        code: 'SEARCH_FAILED'
      },
      { status: 500 }
    );
  }
}
