// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション8.2: Props型定義
// - セクション9: エラーハンドリング
// - サーバーアクション: お気に入り追加/削除のみ使用
// - API Routes: ライブステータス取得（短時間キャッシュ）

'use client';

import { useState, useEffect, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { API_ENDPOINTS } from '@/lib/constants';

import type { FavoriteStreamer } from '@/types';
import { getFavoriteStreamers, removeFavoriteStreamer } from '@/actions/favorites';

interface FavoriteWithLive extends FavoriteStreamer {
  isLive?: boolean;
}

interface FavoriteListProps {
  onSelectStreamer: (favorite: FavoriteStreamer) => void;
  refreshTrigger?: number;
}

export function FavoriteList({ onSelectStreamer, refreshTrigger }: FavoriteListProps) {
  const [favorites, setFavorites] = useState<FavoriteWithLive[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetchFavorites();
  }, [refreshTrigger]);

  const fetchFavorites = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // サーバーアクションでお気に入りを取得
      const result = await getFavoriteStreamers();

      if (!result.success || !result.data) {
        throw new Error('お気に入りの取得に失敗しました');
      }

      const favoritesData = result.data;

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
              const liveStreamerIds = new Set(liveStatusResult.data.map((stream: any) => stream.user_id));

              const favoritesWithLive = favoritesData.map((favorite) => ({
                ...favorite,
                isLive: liveStreamerIds.has(favorite.streamerId),
              }));

              setFavorites(favoritesWithLive);
            } else {
              setFavorites(favoritesData);
            }
          } else {
            setFavorites(favoritesData);
          }
        } catch (error) {
          console.error('Fetch live status error:', error);
          setFavorites(favoritesData);
        }
      } else {
        setFavorites(favoritesData);
      }
    } catch (error) {
      console.error('Fetch favorites error:', error);
      setError('お気に入りの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (streamerId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    startTransition(async () => {
      // サーバーアクションでお気に入りを削除
      const result = await removeFavoriteStreamer(streamerId);

      if (result.success) {
        setFavorites(favorites.filter((f) => f.streamerId !== streamerId));
      } else {
        alert(result.message);
      }
    });
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-400">読み込み中...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-700/50 text-red-400 text-sm p-3 rounded-md">
        {error}
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        お気に入りの配信者がまだありません
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {favorites.map((favorite) => (
        <Card
          key={favorite.id}
          className="p-3 bg-gray-900 border-gray-700 hover:bg-gray-800 cursor-pointer transition"
          onClick={() => onSelectStreamer(favorite)}
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
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-600 rounded-full border-2 border-gray-900" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-100">{favorite.streamerName}</span>
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
              disabled={isPending}
            >
              {isPending ? '削除中...' : '削除'}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
