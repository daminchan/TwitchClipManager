// 適用スキル: component-creator (カスタムフック)
// 適用ルール:
// - セクション3: ディレクトリ構造（hooks/配下に配置）
// - セクション4.3: 関数命名規則（camelCase）
// - CLAUDE.md セクション801-903: サーバーアクション使用

import { useState, useEffect } from 'react';
import type { TwitchClip } from '@/types/twitch';
import { getFavoriteClips } from '@/actions/clips';
import type { ClipFilterType } from '@/lib/constants';

export function useFavoriteClips(
  refreshTrigger: number,
  filter: ClipFilterType = 'WEEK'
) {
  const [clips, setClips] = useState<TwitchClip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClips();
  }, [refreshTrigger, filter]);

  const fetchClips = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // サーバーアクションでクリップを取得
      const result = await getFavoriteClips(filter);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'クリップの取得に失敗しました');
      }

      setClips(result.data);

      if (result.data.length === 0) {
        setError('お気に入り配信者のクリップがありません');
      }
    } catch (err) {
      console.error('Fetch clips error:', err);
      setError('クリップの読み込みに失敗しました');
      setClips([]);
    } finally {
      setIsLoading(false);
    }
  };

  return { clips, isLoading, error, refetch: fetchClips };
}
