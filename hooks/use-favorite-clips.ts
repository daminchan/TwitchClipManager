// 適用スキル: component-creator (カスタムフック)
// 適用ルール:
// - セクション3: ディレクトリ構造（hooks/配下に配置）
// - セクション4.3: 関数命名規則（camelCase）
// - API Routes を使用してクリップ取得（キャッシュ最適化）

import { useState, useEffect, useCallback } from 'react';
import type { TwitchClip } from '@/types/twitch';
import { ClipFilterType, API_ENDPOINTS } from '@/lib/constants';

export function useFavoriteClips(
  refreshTrigger: number,
  filter: ClipFilterType = 'WEEK'
) {
  const [clips, setClips] = useState<TwitchClip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, filter]);

  const fetchClips = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // API Route でクリップを取得（キャッシュ最適化）
      const response = await fetch(
        `${API_ENDPOINTS.CLIPS.FAVORITES}?filter=${filter}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('クリップの取得に失敗しました');
      }

      const result = await response.json();

      if (!result.data) {
        throw new Error('データが取得できませんでした');
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
  }, [filter]);

  return { clips, isLoading, error, refetch: fetchClips };
}
