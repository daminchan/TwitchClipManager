// - サーバーアクション: お気に入り追加/削除のみ使用
// - API Routes: ライブステータス取得（短時間キャッシュ）

'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InlineLoadingSpinner } from '@/components/ui/loading-spinner';
import { API_ENDPOINTS, LABELS, ANIMATION, CACHE_TIME } from '@/lib/constants';
import { sortByLiveStatus } from '@/lib/utils';

import type { FavoriteStreamer } from '@/types';
import { removeFavoriteStreamer } from '@/actions/favorites';

interface FavoriteWithLive extends FavoriteStreamer {
  isLive?: boolean;
}

interface FavoriteListProps {
  onRemoveFavorite?: () => void;
}

export function FavoriteList({ onRemoveFavorite }: FavoriteListProps) {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showCards, setShowCards] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // マウント後、サイドバーが開ききってからカード表示開始
  useEffect(() => {
    const timer = setTimeout(() => setShowCards(true), ANIMATION.SIDEBAR_CONTENT_DELAY);
    return () => clearTimeout(timer);
  }, []);

  // お気に入り配信者を取得（React Query）
  const { data: favorites = [], isLoading, error } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      // API Route でお気に入りを取得
      const response = await fetch(API_ENDPOINTS.FAVORITES, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store', // ブラウザキャッシュを使わない（React Queryのキャッシュのみ使用）
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です');
        }
        throw new Error('お気に入りの取得に失敗しました');
      }

      const result = await response.json();

      if (!result.data) {
        throw new Error('データが取得できませんでした');
      }

      const favoritesData = result.data as FavoriteStreamer[];

      // Fetch live status for all favorites
      if (favoritesData.length > 0) {
        const broadcasterIds = favoritesData.map((f) => f.streamerId);

        // API Route でライブステータスを取得（短時間キャッシュ）
        try {
          const response = await fetch(
            `${API_ENDPOINTS.TWITCH.LIVE_STATUS}?ids=${broadcasterIds.join(',')}`,
            {
              method: 'GET',
            }
          );

          if (response.ok) {
            const liveStatusResult = await response.json();

            if (liveStatusResult.data) {
              const liveStreamerIds = new Set(liveStatusResult.data.map((stream: { user_id: string }) => stream.user_id));

              const favoritesWithLive: FavoriteWithLive[] = favoritesData.map((favorite) => ({
                ...favorite,
                isLive: liveStreamerIds.has(favorite.streamerId),
              }));

              return favoritesWithLive;
            }
          }
        } catch (error) {

        }
      }

      return favoritesData as FavoriteWithLive[];
    },
    staleTime: CACHE_TIME.LIVE_STATUS,
  });

  // お気に入り削除のミューテーション
  const removeMutation = useMutation({
    mutationFn: async (streamerId: string) => {
      return await removeFavoriteStreamer(streamerId);
    },
    onSuccess: async () => {
      // お気に入りリストを再取得
      await queryClient.invalidateQueries({ queryKey: ['favorites'] });
      // クリップキャッシュも無効化（全フィルター対象）
      await queryClient.invalidateQueries({
        queryKey: ['clips', 'favorites'],
        refetchType: 'active'
      });
      // 親コンポーネントに通知
      onRemoveFavorite?.();
    },
  });

  const handleRemove = async (streamerId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    setDeletingId(streamerId);

    try {
      const result = await removeMutation.mutateAsync(streamerId);

      if (!result.success) {
        alert(result.message);
      }
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return <InlineLoadingSpinner />;
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-700/50 text-red-400 text-sm p-3 rounded-md">
        お気に入りの読み込みに失敗しました
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        お気に入りの配信者がまだありません
      </div>
    );
  }

  // LIVE中の人を優先してソート
  const sortedFavorites = sortByLiveStatus(favorites);

  // 表示する配信者を決定
  const displayLimit = 5;
  const visibleFavorites = isExpanded ? sortedFavorites : sortedFavorites.slice(0, displayLimit);
  const hiddenCount = sortedFavorites.length - displayLimit;

  // Twitchページを開く
  const handleClickStreamer = (streamerLogin: string) => {
    window.open(`https://twitch.tv/${streamerLogin}`, '_blank');
  };

  return (
    <div className="space-y-2">
      {visibleFavorites.map((favorite, index) => (
        <Card
          key={favorite.id}
          className={`p-3 bg-white border-gray-200 hover:bg-gray-100 cursor-pointer transition ${showCards ? 'animate-card' : 'opacity-0'}`}
          style={showCards ? { animationDelay: `${index * ANIMATION.CARD_DELAY_STEP}ms` } : undefined}
          onClick={() => handleClickStreamer(favorite.streamerLogin)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                {favorite.streamerImage && (
                  <img
                    src={favorite.streamerImage}
                    alt={favorite.streamerName}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                {favorite.isLive && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-600 rounded-full border-2 border-white" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-900">{favorite.streamerName}</span>
                  {favorite.isLive && (
                    <Badge className="bg-red-600 text-white text-xs px-2 py-0">LIVE</Badge>
                  )}
                </div>
                <div className="text-xs text-gray-500">@{favorite.streamerLogin}</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleRemove(favorite.streamerId, e)}
              className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
              disabled={deletingId === favorite.streamerId}
            >
              {deletingId === favorite.streamerId ? LABELS.BUTTONS.DELETING : LABELS.BUTTONS.DELETE}
            </Button>
          </div>
        </Card>
      ))}

      {/* もっと見る / 閉じる ボタン */}
      {sortedFavorites.length > displayLimit && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          {isExpanded ? '▲ 閉じる' : `▼ もっと見る (${hiddenCount}人)`}
        </button>
      )}
    </div>
  );
}
