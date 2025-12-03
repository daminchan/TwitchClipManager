/**
 * おすすめ配信者取得 API Route（クリップベース）
 *
 * 適用スキル: api-creator
 * 適用ルール:
 * - CLAUDE.md セクション6: API設計原則
 * - オンボーディングフロー設計.md: おすすめ配信者機能（クリップベース）
 *
 * 理由:
 * - ゲームIDでクリップを取得し、クリップ再生数が多い配信者Top 6を抽出
 * - Twitch APIには配信者アーカイブを期間で絞るクエリがない
 * - クリップはゲームIDで直接取得可能 + 期間指定可能
 * - APIリクエスト数が少ない（7回: クリップ1 + プロフィール6）
 */

import { NextResponse } from 'next/server';
import { getClipsByGame, getStreamerById } from '@/lib/twitch-api';
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
    const gameId = searchParams.get('gameId');

    if (!gameId) {
      return NextResponse.json(
        { error: 'gameId is required', code: 'MISSING_PARAM' },
        { status: 400 }
      );
    }

    // 直近3日間の期間を設定
    const endedAt = new Date();
    const startedAt = new Date();
    startedAt.setDate(startedAt.getDate() - 3);

    // 1. ゲームIDでクリップを取得（直近3日間、再生数順、最大100件）
    const clips = await getClipsByGame(gameId, {
      first: 100,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
    });

    if (clips.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // 2. 日本の配信者のクリップのみフィルター
    const jaClips = clips.filter((clip: TwitchClip) => clip.language === 'ja');

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

    // 4. 総再生数でソートしてTop 6
    const top6Broadcasters = Array.from(broadcasterMap.values())
      .sort((a, b) => b.total_views - a.total_views)
      .slice(0, 6);

    // 5. プロフィール画像を並列取得
    const results = await Promise.all(
      top6Broadcasters.map(async (broadcaster) => {
        try {
          const user = await getStreamerById(broadcaster.broadcaster_id);
          return {
            userId: broadcaster.broadcaster_id,
            userName: broadcaster.broadcaster_name,
            userLogin: user?.login || broadcaster.broadcaster_name.toLowerCase(),
            profileImageUrl: user?.profile_image_url || '',
            totalClipViews: broadcaster.total_views,
            clipCount: broadcaster.clips.length,
            topClips: broadcaster.clips.slice(0, 3), // 代表的なクリップ3つ
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
            topClips: broadcaster.clips.slice(0, 3),
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
