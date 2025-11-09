/**
 * Dashboard クリップ管理用カスタムフック（React Query版）
 * クリップの取得、フィルター、ソート、いいね機能のロジックを集約
 *
 * 適用ルール:
 * - セクション2: 技術スタック（React Query）
 * - セクション7: 状態管理（useQuery でサーバー状態管理）
 * - セクション10.2: サーバーアクション（いいね機能）
 * - セクション14.2: カスタムフック（複雑なロジック分離）
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TwitchClip } from '@/types/twitch';
import type { SortType } from '@/components/dashboard/clip-sort-tabs';
import { API_ENDPOINTS } from '@/lib/constants';
import { getLikedClips, addLikedClip, removeLikedClip } from '@/actions/liked-clips';

export function useDashboardClips() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState<SortType>('views');

  // お気に入り配信者のクリップを取得（React Query）
  // フィルターは直近2日間固定
  const {
    data: allClips = [],
    isLoading: isLoadingClips,
    error: clipError,
  } = useQuery({
    queryKey: ['clips', 'favorites'],
    queryFn: async () => {
      const response = await fetch(API_ENDPOINTS.CLIPS.FAVORITES, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store', // ブラウザキャッシュを使わない（React Queryのキャッシュのみ使用）
      });

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

      return result.data as TwitchClip[];
    },
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
  });

  // いいねしたクリップIDを取得（React Query）
  const { data: likedClipsData } = useQuery({
    queryKey: ['clips', 'liked'],
    queryFn: async () => {
      const result = await getLikedClips();
      if (result.success && result.data) {
        return result.data;
      }
      return [];
    },
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
  });

  // likedClipIds を Set に変換
  const likedClipIds = useMemo(() => {
    if (!likedClipsData) return new Set<string>();
    return new Set(likedClipsData.map((clip) => clip.clipId));
  }, [likedClipsData]);

  // いいね追加のミューテーション
  const addLikeMutation = useMutation({
    mutationFn: async (clip: TwitchClip) => {
      return await addLikedClip({
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
    },
    onSuccess: () => {
      // いいねクリップのキャッシュを無効化して再取得
      queryClient.invalidateQueries({ queryKey: ['clips', 'liked'] });
    },
  });

  // いいね解除のミューテーション
  const removeLikeMutation = useMutation({
    mutationFn: async (clipId: string) => {
      return await removeLikedClip(clipId);
    },
    onSuccess: () => {
      // いいねクリップのキャッシュを無効化して再取得
      queryClient.invalidateQueries({ queryKey: ['clips', 'liked'] });
    },
  });

  // いいね/解除の処理
  const handleLikeToggle = async (clipId: string, isCurrentlyLiked: boolean) => {
    try {
      if (isCurrentlyLiked) {
        const result = await removeLikeMutation.mutateAsync(clipId);
        return result;
      } else {
        const clip = allClips.find((c) => c.id === clipId);
        if (!clip) return { success: false, message: 'クリップが見つかりません' };

        const result = await addLikeMutation.mutateAsync(clip);
        return result;
      }
    } catch (error) {
      console.error('Like toggle error:', error);
      return { success: false, message: 'いいね操作に失敗しました' };
    }
  };

  // フィルターとソートを適用（useMemo で最適化）
  const filteredClips = useMemo(() => {
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

    return result;
  }, [allClips, searchQuery, sortType]);

  return {
    // State
    allClips,
    filteredClips,
    isLoadingClips,
    clipError: clipError ? String(clipError) : allClips.length === 0 ? 'お気に入り配信者のクリップがありません' : null,
    searchQuery,
    sortType,
    likedClipIds,

    // Setters
    setSearchQuery,
    setSortType,

    // Functions
    handleLikeToggle,
  };
}
