// 機能: トップページ3セクション（ランキング・HOT・おすすめ）振り分けロジック

import { useMemo } from 'react';

import { HOME_SECTIONS } from '@/lib/constants';
import type { TwitchClip } from '@/types/twitch';

interface UseHomeSectionsParams {
  popularClips: TwitchClip[];
  favoriteClips: TwitchClip[];
  isAuthenticated: boolean;
}

interface HomeSections {
  ranking: TwitchClip[];
  hot: TwitchClip[];
  recommended: TwitchClip[];
}

/**
 * HOTスコアを算出
 * hotScore = view_count / (経過時間h + 2)^1.5
 */
function calcHotScore(clip: TwitchClip, now: number): number {
  const createdAt = new Date(clip.created_at).getTime();
  const hoursAge = (now - createdAt) / (1000 * 60 * 60);
  return clip.view_count / Math.pow(hoursAge + HOME_SECTIONS.HOT_SCORE_OFFSET, HOME_SECTIONS.HOT_SCORE_GRAVITY);
}

/**
 * お気に入りクリップと一般クリップをインターリーブで混合
 * お気に入り70% / 一般30% の比率
 */
function interleaveClips(
  favoriteClips: TwitchClip[],
  generalClips: TwitchClip[],
): TwitchClip[] {
  const result: TwitchClip[] = [];
  const seenIds = new Set<string>();
  let fi = 0;
  let gi = 0;

  while (fi < favoriteClips.length || gi < generalClips.length) {
    let favAdded = 0;
    while (fi < favoriteClips.length && favAdded < 7) {
      if (!seenIds.has(favoriteClips[fi].id)) {
        seenIds.add(favoriteClips[fi].id);
        result.push(favoriteClips[fi]);
        favAdded++;
      }
      fi++;
    }

    let genAdded = 0;
    while (gi < generalClips.length && genAdded < 3) {
      if (!seenIds.has(generalClips[gi].id)) {
        seenIds.add(generalClips[gi].id);
        result.push(generalClips[gi]);
        genAdded++;
      }
      gi++;
    }
  }

  return result;
}

/**
 * トップページの3セクションにクリップを振り分けるフック
 */
export function useHomeSections({
  popularClips,
  favoriteClips,
  isAuthenticated,
}: UseHomeSectionsParams): HomeSections {
  return useMemo(() => {
    const now = Date.now();

    // ① 週間ランキング: 再生数TOP10
    const ranking = popularClips
      .toSorted((a, b) => b.view_count - a.view_count)
      .slice(0, HOME_SECTIONS.RANKING_COUNT);

    const rankingIds = new Set(ranking.map((c) => c.id));

    // ② HOT: hotScore上位5件（ランキング除外）
    const hot = popularClips
      .filter((c) => !rankingIds.has(c.id))
      .map((clip) => ({ clip, score: calcHotScore(clip, now) }))
      .toSorted((a, b) => b.score - a.score)
      .slice(0, HOME_SECTIONS.HOT_COUNT)
      .map(({ clip }) => clip);

    const usedIds = new Set([...rankingIds, ...hot.map((c) => c.id)]);

    // ③ おすすめ: 残りのクリップ
    const remainingPopular = popularClips
      .filter((c) => !usedIds.has(c.id))
      .toSorted((a, b) => b.view_count - a.view_count);

    let recommended: TwitchClip[];

    if (isAuthenticated && favoriteClips.length > 0) {
      const remainingFavorites = favoriteClips
        .filter((c) => !usedIds.has(c.id))
        .toSorted((a, b) => b.view_count - a.view_count);

      recommended = interleaveClips(remainingFavorites, remainingPopular);
    } else {
      recommended = remainingPopular;
    }

    return { ranking, hot, recommended };
  }, [popularClips, favoriteClips, isAuthenticated]);
}
