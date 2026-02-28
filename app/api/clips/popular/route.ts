/**
 * 人気クリップ取得 API Route（認証不要）
 *
 * 人気ゲームから日本語クリップを取得して返す
 * 未認証ユーザー向けのトップページ表示用
 */

import { NextResponse } from 'next/server';
import { getTopGames, getClipsByGame } from '@/lib/twitch-api';
import { POPULAR_CLIPS_CONFIG } from '@/lib/constants';
import type { TwitchClip, TwitchGame } from '@/types/twitch';

export async function GET() {
  try {
    // 人気ゲームを取得
    const games: TwitchGame[] = await getTopGames(POPULAR_CLIPS_CONFIG.TOP_GAMES_COUNT);

    if (!games || games.length === 0) {
      return NextResponse.json(
        { data: [] },
        {
          headers: {
            'Cache-Control': 'public, max-age=600',
          },
        }
      );
    }

    // 期間設定（直近7日間）
    const endedAt = new Date();
    const startedAt = new Date();
    startedAt.setDate(startedAt.getDate() - POPULAR_CLIPS_CONFIG.DAYS);

    // 各ゲームのクリップを並列取得
    const clipPromises = games.map(async (game: TwitchGame) => {
      try {
        const clips: TwitchClip[] = await getClipsByGame(game.id, {
          first: POPULAR_CLIPS_CONFIG.CLIPS_PER_GAME,
          startedAt: startedAt.toISOString(),
          endedAt: endedAt.toISOString(),
        });

        // 日本語クリップのみフィルタ
        const jaClips = clips.filter((clip: TwitchClip) => clip.language === 'ja');

        // 各配信者の上位N件に制限
        const streamerClipCount = new Map<string, number>();
        return jaClips.filter((clip: TwitchClip) => {
          const count = streamerClipCount.get(clip.broadcaster_id) || 0;
          if (count >= POPULAR_CLIPS_CONFIG.MAX_PER_STREAMER) return false;
          streamerClipCount.set(clip.broadcaster_id, count + 1);
          return true;
        });
      } catch (error) {
        console.error(`Failed to fetch clips for game ${game.name}:`, error);
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
          'Cache-Control': 'public, max-age=600',
        },
      }
    );
  } catch (error) {
    console.error('Get popular clips error:', error);
    return NextResponse.json(
      { error: '人気クリップの取得に失敗しました', code: 'FETCH_FAILED' },
      { status: 500 }
    );
  }
}
