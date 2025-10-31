/**
 * Dashboard クリップ管理用カスタムフック
 * クリップの取得、フィルター、ソート、いいね機能のロジックを集約
 *
 * 適用ルール:
 * - API Routes を使用してクリップ取得（キャッシュ最適化）
 * - Server Actions はいいね機能のみ使用（データベース書き込み）
 */

import { useState, useEffect, useCallback } from 'react';
import type { TwitchClip } from '@/types/twitch';
import type { SortType } from '@/components/dashboard/clip-sort-tabs';
import { ClipFilterType, API_ENDPOINTS } from '@/lib/constants';
import { getLikedClips, addLikedClip, removeLikedClip } from '@/actions/liked-clips';

export function useDashboardClips() {
  const [allClips, setAllClips] = useState<TwitchClip[]>([]);
  const [filteredClips, setFilteredClips] = useState<TwitchClip[]>([]);
  const [isLoadingClips, setIsLoadingClips] = useState(true);
  const [clipError, setClipError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState<SortType>('views');
  const [clipFilter, setClipFilter] = useState<ClipFilterType>('WEEK');
  const [likedClipIds, setLikedClipIds] = useState<Set<string>>(new Set());

  // お気に入り配信者のクリップを取得（フィルター付き）
  const fetchAllFavoriteClips = useCallback(async (filter?: ClipFilterType) => {
    setIsLoadingClips(true);
    setClipError(null);

    const filterParam = filter || clipFilter;

    try {
      // API Route でクリップを取得（キャッシュ最適化）
      const response = await fetch(
        `${API_ENDPOINTS.CLIPS.FAVORITES}?filter=${filterParam}`,
        {
          method: 'GET',
          credentials: 'include', // Cookie を含める（認証）
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です');
        }
        throw new Error('クリップの取得に失敗しました');
      }

      const result = await response.json();

      if (!result.data) {
        throw new Error('データが取得できませんでした');
      }

      setAllClips(result.data);

      if (result.data.length === 0) {
        setClipError('お気に入り配信者のクリップがありません');
      }
    } catch (error) {
      console.error('Fetch clips error:', error);
      setClipError('クリップの読み込みに失敗しました');
      setAllClips([]);
    } finally {
      setIsLoadingClips(false);
    }
  }, [clipFilter]);

  // いいねしたクリップIDを取得
  const fetchLikedClips = async () => {
    try {
      // サーバーアクションでいいねクリップを取得
      const result = await getLikedClips();

      if (result.success && result.data) {
        const likedIds = new Set(result.data.map((clip) => clip.clipId));
        setLikedClipIds(likedIds);
      }
    } catch (error) {
      console.error('Fetch liked clips error:', error);
    }
  };

  // フィルターとソートを適用
  const applyFiltersAndSort = () => {
    let result = [...allClips];

    // 検索フィルター
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (clip) =>
          clip.title.toLowerCase().includes(query) ||
          clip.broadcaster_name.toLowerCase().includes(query) ||
          clip.creator_name.toLowerCase().includes(query)
      );
    }

    // ソート
    if (sortType === 'views') {
      result.sort((a, b) => b.view_count - a.view_count);
    } else if (sortType === 'date-desc') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortType === 'date-asc') {
      result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    setFilteredClips(result);
  };

  // いいね/解除の処理
  const handleLikeToggle = async (clipId: string, isCurrentlyLiked: boolean) => {
    try {
      if (isCurrentlyLiked) {
        // サーバーアクションでいいね解除
        const result = await removeLikedClip(clipId);

        if (result.success) {
          setLikedClipIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(clipId);
            return newSet;
          });
        }

        return result;
      } else {
        // いいね追加
        const clip = allClips.find((c) => c.id === clipId);
        if (!clip) return { success: false, message: 'クリップが見つかりません' };

        // サーバーアクションでいいね追加
        const result = await addLikedClip({
          clipId: clip.id,
          clipUrl: clip.url,
          clipEmbedUrl: clip.embed_url,
          clipTitle: clip.title,
          broadcasterId: clip.broadcaster_id,
          broadcasterName: clip.broadcaster_name,
          creatorName: clip.creator_name,
          thumbnailUrl: clip.thumbnail_url,
          viewCount: clip.view_count,
          duration: clip.duration,
          clipCreatedAt: clip.created_at,
        });

        if (result.success) {
          setLikedClipIds((prev) => new Set(prev).add(clipId));
        }

        return result;
      }
    } catch (error) {
      console.error('Like toggle error:', error);
      return { success: false, message: 'いいね操作に失敗しました' };
    }
  };

  // 検索とソートが変更されたら再フィルター
  useEffect(() => {
    applyFiltersAndSort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allClips, searchQuery, sortType]);

  return {
    // State
    allClips,
    filteredClips,
    isLoadingClips,
    clipError,
    searchQuery,
    sortType,
    clipFilter,
    likedClipIds,

    // Setters
    setSearchQuery,
    setSortType,
    setClipFilter,

    // Functions
    fetchAllFavoriteClips,
    fetchLikedClips,
    handleLikeToggle,
  };
}
