/**
 * クリップ関連のサーバーアクション
 * セキュアなサーバー側処理
 *
 * 適用ルール:
 * - CLAUDE.md セクション801-903: サーバーアクション
 * - CLAUDE.md セクション541-564: エラーハンドリング
 */

'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getClipsByBroadcaster } from '@/lib/twitch-api';
import { CLIP_FILTERS, ClipFilterType } from '@/lib/constants';
import type { TwitchClip } from '@/types/twitch';
import type { FavoriteStreamer } from '@/types';

export interface GetFavoriteClipsResult {
  success: boolean;
  data?: TwitchClip[];
  error?: string;
}

/**
 * お気に入り配信者全員の人気クリップを取得
 *
 * @param filter - WEEK（過去7日間、各配信者5件）| THREE_DAYS（直近3日間、合計10件）| MONTH（過去30日間、合計3件）
 */
export async function getFavoriteClips(
  filter: ClipFilterType = 'WEEK'
): Promise<GetFavoriteClipsResult> {
  try {
    // 認証チェック
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized'
      };
    }

    // フィルター設定を取得
    const filterConfig = CLIP_FILTERS[filter] || CLIP_FILTERS.WEEK;

    // お気に入り配信者を取得
    const favorites = await prisma.favoriteStreamer.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (favorites.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    // 期間を設定
    const endedAt = new Date();
    const startedAt = new Date();
    startedAt.setDate(startedAt.getDate() - filterConfig.days);

    // 各配信者のクリップを並列で取得
    const clipPromises = favorites.map(async (favorite: FavoriteStreamer) => {
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

    return {
      success: true,
      data: allClips
    };
  } catch (error) {
    console.error('Get favorite clips error:', error);
    return {
      success: false,
      error: 'Failed to fetch clips'
    };
  }
}
