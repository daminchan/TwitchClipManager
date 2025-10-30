// 適用スキル: component-creator (カスタムフック)
// 適用ルール:
// - セクション3: ディレクトリ構造（hooks/配下に配置）
// - セクション4.3: 関数命名規則（camelCase）

import { useState, useEffect } from 'react';
import type { TwitchClip } from '@/types/twitch';

export function useFavoriteClips(refreshTrigger: number) {
  const [clips, setClips] = useState<TwitchClip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClips();
  }, [refreshTrigger]);

  const fetchClips = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/clips/favorites');

      if (!response.ok) {
        throw new Error('クリップの取得に失敗しました');
      }

      const { data } = await response.json();
      setClips(data || []);

      if (data.length === 0) {
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
