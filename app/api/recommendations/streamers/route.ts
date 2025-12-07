/**
 * おすすめ配信者取得 API Route（クリップベース）
 *
 * 適用スキル: api-creator
 * 適用ルール:
 * - CLAUDE.md セクション6: API設計原則
 * - オンボーディングフロー設計.md: おすすめ配信者機能（クリップベース）
 *
 * 機能:
 * - 単一ゲーム: ?gameId=xxx&limit=6 (オンボーディング用)
 * - 複数ゲーム: ?gameIds=xxx,yyy,zzz&limit=15 (ゲームベース追加用)
 *
 * 理由:
 * - ゲームIDでクリップを取得し、クリップ再生数が多い配信者を抽出
 * - Twitch APIには配信者アーカイブを期間で絞るクエリがない
 * - クリップはゲームIDで直接取得可能 + 期間指定可能
 * - 後方互換性を保ちながら複数ゲーム対応
 */

import { NextResponse } from 'next/server';
import { getClipsByGame, getStreamerById } from '@/lib/twitch-api';
import { TWITCH_API_CONFIG } from '@/lib/constants';
import type { TwitchClip } from '@/types/twitch';

interface BroadcasterStats {
  broadcaster_id: string;
  broadcaster_name: string;
  clips: TwitchClip[];
  total_views: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');       // 単一ゲーム（既存）
    const gameIds = searchParams.get('gameIds');     // 複数ゲーム（新機能）
    const limit = parseInt(searchParams.get('limit') || '6', 10); // デフォルト6

    // パラメータバリデーション
    if (!gameId && !gameIds) {
      return NextResponse.json(
        { error: 'gameId or gameIds is required', code: 'MISSING_PARAM' },
        { status: 400 }
      );
    }

    // ゲームID配列を作成
    const gameIdArray = gameIds ? gameIds.split(',').filter(Boolean) : [gameId!];

    // 直近N日間の期間を設定
    const endedAt = new Date();
    const startedAt = new Date();
    startedAt.setDate(startedAt.getDate() - TWITCH_API_CONFIG.RECOMMENDATION_DAYS);

    // 1. 複数ゲームのクリップを並列取得
    const clipsPromises = gameIdArray.map(gid =>
      getClipsByGame(gid, {
        first: TWITCH_API_CONFIG.CLIPS_PER_QUERY,
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
      })
    );

    const clipsArrays = await Promise.all(clipsPromises);
    const allClips = clipsArrays.flat(); // 全ゲームのクリップをマージ

    if (allClips.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // 2. 日本の配信者のクリップのみフィルター
    const jaClips = allClips.filter((clip: TwitchClip) => clip.language === 'ja');

    if (jaClips.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // 3. 配信者ごとにクリップをグループ化 + 総再生数を計算
    const broadcasterMap = new Map<string, BroadcasterStats>();

    jaClips.forEach((clip: TwitchClip) => {
      if (!broadcasterMap.has(clip.broadcaster_id)) {
        broadcasterMap.set(clip.broadcaster_id, {
          broadcaster_id: clip.broadcaster_id,
          broadcaster_name: clip.broadcaster_name,
          clips: [],
          total_views: 0,
        });
      }

      const broadcaster = broadcasterMap.get(clip.broadcaster_id)!;
      broadcaster.clips.push(clip);
      broadcaster.total_views += clip.view_count;
    });

    // 4. 総再生数でソートして指定件数取得（limit）
    const topBroadcasters = Array.from(broadcasterMap.values())
      .sort((a, b) => b.total_views - a.total_views)
      .slice(0, limit);

    // 5. プロフィール画像を並列取得
    const results = await Promise.all(
      topBroadcasters.map(async (broadcaster) => {
        try {
          const user = await getStreamerById(broadcaster.broadcaster_id);
          return {
            userId: broadcaster.broadcaster_id,
            userName: broadcaster.broadcaster_name,
            userLogin: user?.login || broadcaster.broadcaster_name.toLowerCase(),
            profileImageUrl: user?.profile_image_url || '',
            totalClipViews: broadcaster.total_views,
            clipCount: broadcaster.clips.length,
            topClips: broadcaster.clips.slice(0, TWITCH_API_CONFIG.TOP_CLIPS_COUNT),
          };
        } catch (error) {
          console.error(
            `Failed to fetch profile for ${broadcaster.broadcaster_name}:`,
            error
          );
          return {
            userId: broadcaster.broadcaster_id,
            userName: broadcaster.broadcaster_name,
            userLogin: broadcaster.broadcaster_name.toLowerCase(),
            profileImageUrl: '',
            totalClipViews: broadcaster.total_views,
            clipCount: broadcaster.clips.length,
            topClips: broadcaster.clips.slice(0, TWITCH_API_CONFIG.TOP_CLIPS_COUNT),
          };
        }
      })
    );

    return NextResponse.json(
      { data: results },
      {
        headers: {
          // プライベートキャッシュ（ゲームIDごとに異なるデータ）
          // 5分間ブラウザキャッシュ
          'Cache-Control': 'private, max-age=300',
        },
      }
    );
  } catch (error) {
    console.error('Get recommended streamers error:', error);

    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }

    return NextResponse.json(
      {
        error: 'おすすめ配信者の取得に失敗しました',
        code: 'FETCH_FAILED',
      },
      { status: 500 }
    );
  }
}
