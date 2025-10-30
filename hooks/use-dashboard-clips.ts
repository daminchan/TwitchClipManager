/**
 * Dashboard クリップ管理用カスタムフック
 * クリップの取得、フィルター、ソート、いいね機能のロジックを集約
 */

import { useState, useEffect } from 'react';
import type { TwitchClip } from '@/types/twitch';
import type { SortType } from '@/components/dashboard/clip-sort-tabs';
import { API_ENDPOINTS, ClipFilterType } from '@/lib/constants';
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
  const fetchAllFavoriteClips = async (filter?: ClipFilterType) => {
    setIsLoadingClips(true);
    setClipError(null);

    const filterParam = filter || clipFilter;

    try {
      const url = `${API_ENDPOINTS.CLIPS.FAVORITES}?filter=${filterParam}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('クリップの取得に失敗しました');
      }

      const { data } = await response.json();
      setAllClips(data || []);

      if (data.length === 0) {
        setClipError('お気に入り配信者のクリップがありません');
      }
    } catch (error) {
      console.error('Fetch clips error:', error);
      setClipError('クリップの読み込みに失敗しました');
      setAllClips([]);
    } finally {
      setIsLoadingClips(false);
    }
  };

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
