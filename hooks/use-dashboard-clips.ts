import { useState, useMemo, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TwitchClip } from '@/types/twitch';
import type { SortType } from '@/components/dashboard/clip-sort-tabs';
import { API_ENDPOINTS, LABELS, ANIMATION, CACHE_TIME } from '@/lib/constants';
import { getLikedClips, addLikedClip, removeLikedClip } from '@/actions/liked-clips';
import type { LikedClip } from '@/types/database';

export function useDashboardClips() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState<SortType>('date-desc');

  // Debounce用のタイマー管理
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingActionsRef = useRef<Map<string, boolean>>(new Map());

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
          throw new Error(LABELS.ERRORS.AUTH_REQUIRED);
        }
        throw new Error(LABELS.ERRORS.CLIPS_FETCH_FAILED);
      }

      const result = await response.json();

      if (!result.data) {
        throw new Error(LABELS.ERRORS.CLIPS_DATA_EMPTY);
      }

      return result.data as TwitchClip[];
    },
    staleTime: CACHE_TIME.DEFAULT_STALE_TIME,
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
    staleTime: CACHE_TIME.DEFAULT_STALE_TIME,
  });

  // likedClipIds を Set に変換
  const likedClipIds = useMemo(() => {
    if (!likedClipsData) return new Set<string>();
    return new Set(likedClipsData.map((clip) => clip.clipId));
  }, [likedClipsData]);

  // いいね追加のミューテーション（Debounce後に実行）
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
    // 完了時：サーバーと同期
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['clips', 'liked'] });
    },
  });

  // いいね解除のミューテーション（Debounce後に実行）
  const removeLikeMutation = useMutation({
    mutationFn: async (clipId: string) => {
      return await removeLikedClip(clipId);
    },
    // 完了時：サーバーと同期
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['clips', 'liked'] });
    },
  });

  // いいね/解除の処理（即座にUI更新 + Debounce）
  const handleLikeToggle = useCallback(
    (clipId: string, isCurrentlyLiked: boolean) => {
      // 1. 即座にUIを更新（楽観的UI）
      const newLikedState = !isCurrentlyLiked;

      queryClient.setQueryData<LikedClip[]>(['clips', 'liked'], (old) => {
        if (!old) return [];

        if (newLikedState) {
          // いいね追加
          const clip = allClips.find((c) => c.id === clipId);
          if (!clip) return old;

          const newClip = {
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
            likedAt: new Date().toISOString(),
          } as LikedClip;
          return [...old, newClip];
        } else {
          // いいね削除
          return old.filter((clip) => clip.clipId !== clipId);
        }
      });

      // 2. 最終状態を記録（連打対応）
      pendingActionsRef.current.set(clipId, newLikedState);

      // 3. Debounce: 既存のタイマーをクリア
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // 4. Debounce後にサーバーに送信（最後の状態のみ）
      debounceTimerRef.current = setTimeout(() => {
        // すべての保留中のアクションをバッチ処理
        const actions = Array.from(pendingActionsRef.current.entries());
        pendingActionsRef.current.clear();

        actions.forEach(([id, shouldLike]) => {
          if (shouldLike) {
            const clip = allClips.find((c) => c.id === id);
            if (clip) {
              addLikeMutation.mutate(clip, {
                onError: () => {
                  queryClient.invalidateQueries({ queryKey: ['clips', 'liked'] });
                },
              });
            }
          } else {
            removeLikeMutation.mutate(id, {
              onError: () => {
                queryClient.invalidateQueries({ queryKey: ['clips', 'liked'] });
              },
            });
          }
        });
      }, ANIMATION.LIKE_DEBOUNCE);
    },
    [allClips, queryClient, addLikeMutation, removeLikeMutation]
  );

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
    clipError: clipError ? String(clipError) : allClips.length === 0 ? LABELS.MESSAGES.NO_FAVORITE_STREAMERS : null,
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
