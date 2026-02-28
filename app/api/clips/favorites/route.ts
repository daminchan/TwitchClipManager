/**
 * お気に入り配信者のクリップ取得 API Route
 *
 * 適用スキル: api-creator
 * 適用ルール:
 * - CLAUDE.md セクション6: API設計原則
 * - API Routes: 読み取り操作でキャッシュが重要
 *
 * 理由:
 * - クリップデータは配信者ごとにキャッシュ可能
 * - 複数ユーザーが同じ配信者をお気に入りにしている場合、キャッシュを共有
 * - Rate Limit 対策（Twitch API 呼び出しを削減）
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getClipsByBroadcaster } from '@/lib/twitch-api';
import { CLIP_FILTERS } from '@/lib/constants';
import type { TwitchClip } from '@/types/twitch';

export async function GET() {
  try {
    // 認証チェック
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '認証が必要です', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // 直近2日間の設定を使用（フィルターは1種類のみ）
    const filterConfig = CLIP_FILTERS.RECENT;

    // お気に入り配信者を取得
    const favorites = await prisma.favoriteStreamer.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (favorites.length === 0) {
      return NextResponse.json(
        { data: [] },
        {
          headers: {
            'Cache-Control': 'private, max-age=60', // 1分間キャッシュ
          },
        }
      );
    }

    // 期間を設定
    const endedAt = new Date();
    const startedAt = new Date();
    startedAt.setDate(startedAt.getDate() - filterConfig.days);

    // 各配信者のクリップを並列で取得（各配信者5件）
    const clipPromises = favorites.map(async (favorite) => {
      try {
        const clips = await getClipsByBroadcaster(favorite.streamerId, {
          first: filterConfig.limit, // 各配信者5件
          startedAt: startedAt.toISOString(),
          endedAt: endedAt.toISOString(),
        });

        // 配信者情報を各クリップに追加
        return clips.map((clip: TwitchClip) => ({
          ...clip,
          profile_image_url: favorite.streamerImage || undefined,
          favoriteStreamerId: favorite.streamerId,
          favoriteStreamerName: favorite.streamerName,
          favoriteStreamerImage: favorite.streamerImage,
        }));
      } catch (error) {
        console.error(`Failed to fetch clips for ${favorite.streamerName}:`, error);
        return [];
      }
    });

    const allClipsArrays = await Promise.all(clipPromises);
    // toSorted()でイミュータブルに（ルール7.12）
    const allClips = allClipsArrays.flat().toSorted((a, b) => b.view_count - a.view_count);

    return NextResponse.json(
      { data: allClips },
      {
        headers: {
          // プライベートキャッシュ（ユーザーごとに異なるデータ）
          // 5分間ブラウザキャッシュ
          'Cache-Control': 'private, max-age=300',
        },
      }
    );
  } catch (error) {
    console.error('Get favorite clips error:', error);

    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }

    return NextResponse.json(
      {
        error: 'クリップの取得に失敗しました',
        code: 'FETCH_FAILED'
      },
      { status: 500 }
    );
  }
}
