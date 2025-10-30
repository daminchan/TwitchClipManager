// 適用スキル: api-creator
// 適用ルール:
// - セクション6.1: API Routes配置
// - セクション9: エラーハンドリング

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getClipsByBroadcaster } from '@/lib/twitch-api';
import { CLIP_FILTERS, ClipFilterType } from '@/lib/constants';

/**
 * GET /api/clips/favorites?filter=WEEK|THREE_DAYS|MONTH
 * お気に入り配信者全員の人気クリップを取得
 *
 * フィルター:
 * - WEEK: 過去7日間、各配信者5件ずつ
 * - THREE_DAYS: 直近3日間、合計10件（再生数トップ）
 * - MONTH: 過去30日間、合計3件（再生数トップ）
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // フィルターパラメータを取得（デフォルトはWEEK）
    const { searchParams } = new URL(request.url);
    const filterParam = searchParams.get('filter') as ClipFilterType | null;
    const filter = filterParam && filterParam in CLIP_FILTERS ? filterParam : 'WEEK';
    const filterConfig = CLIP_FILTERS[filter];

    // お気に入り配信者を取得
    const favorites = await prisma.favoriteStreamer.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (favorites.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // 期間を設定
    const endedAt = new Date();
    const startedAt = new Date();
    startedAt.setDate(startedAt.getDate() - filterConfig.days);

    // 各配信者のクリップを並列で取得
    const clipPromises = favorites.map(async (favorite) => {
      try {
        const clips = await getClipsByBroadcaster(favorite.streamerId, {
          first: filter === 'WEEK' ? filterConfig.limit : 100, // WEEK以外は全件取得して後でトップを抽出
          startedAt: startedAt.toISOString(),
          endedAt: endedAt.toISOString(),
        });

        // 配信者情報を各クリップに追加
        return clips.map((clip: any) => ({
          ...clip,
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
    let allClips = allClipsArrays.flat();

    // 再生数順にソート
    allClips.sort((a, b) => b.view_count - a.view_count);

    // THREE_DAYSとMONTHの場合は上位N件のみ抽出
    if (filter === 'THREE_DAYS' || filter === 'MONTH') {
      allClips = allClips.slice(0, filterConfig.limit);
    }

    return NextResponse.json({ data: allClips });
  } catch (error) {
    console.error('Error fetching favorite clips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clips', details: String(error) },
      { status: 500 }
    );
  }
}
