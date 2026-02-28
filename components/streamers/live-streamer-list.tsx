// - サイドバー用LIVE配信者表示コンポーネント
// - LIVE状態は別クエリに分離（キャッシュ競合回避）

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Radio, Twitch } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { InlineLoadingSpinner } from '@/components/ui/loading-spinner';
import { API_ENDPOINTS, ANIMATION, CACHE_TIME } from '@/lib/constants';

import type { FavoriteStreamer } from '@/types';

export function LiveStreamerList() {
  const [showCards, setShowCards] = useState(false);

  // マウント後、サイドバーが開ききってからカード表示開始
  useEffect(() => {
    const timer = setTimeout(() => setShowCards(true), ANIMATION.SIDEBAR_CONTENT_DELAY);
    return () => clearTimeout(timer);
  }, []);

  // お気に入り配信者を取得（他コンポーネントと共有キャッシュ）
  const { data: favorites = [], isLoading: isFavoritesLoading, error: favoritesError } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const response = await fetch(API_ENDPOINTS.FAVORITES, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
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

      return result.data as FavoriteStreamer[];
    },
    staleTime: CACHE_TIME.DEFAULT_STALE_TIME, // 5分（他コンポーネントと同じ）
  });

  // LIVE状態を別クエリで取得（頻繁に更新、キャッシュ競合を回避）
  const broadcasterIds = useMemo(() => favorites.map((f) => f.streamerId), [favorites]);

  const { data: liveStreamerIds = new Set<string>(), isLoading: isLiveLoading } = useQuery({
    queryKey: ['live-status', broadcasterIds],
    queryFn: async () => {
      if (broadcasterIds.length === 0) {
        return new Set<string>();
      }

      try {
        const response = await fetch(
          `${API_ENDPOINTS.TWITCH.LIVE_STATUS}?ids=${broadcasterIds.join(',')}`,
          { method: 'GET' }
        );

        if (response.ok) {
          const liveStatusResult = await response.json();

          if (liveStatusResult.data) {
            return new Set<string>(liveStatusResult.data.map((stream: { user_id: string }) => stream.user_id));
          }
        }
      } catch (error) {

      }

      return new Set<string>();
    },
    enabled: broadcasterIds.length > 0, // お気に入りがある場合のみ実行
    staleTime: CACHE_TIME.LIVE_STATUS, // 2分間隔で更新
    refetchInterval: CACHE_TIME.LIVE_STATUS, // バックグラウンドで定期的に更新
  });

  // LIVE中の配信者のみをフィルタリング（メモ化）
  const liveStreamers = useMemo(() => {
    return favorites.filter((f) => liveStreamerIds.has(f.streamerId));
  }, [favorites, liveStreamerIds]);

  const isLoading = isFavoritesLoading || (broadcasterIds.length > 0 && isLiveLoading);
  const error = favoritesError;

  // Twitchページを開く
  const handleClickStreamer = (streamerLogin: string) => {
    window.open(`https://twitch.tv/${streamerLogin}`, '_blank');
  };

  if (isLoading) {
    return <InlineLoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-4 text-gray-500 text-xs">
        読み込みに失敗しました
      </div>
    );
  }

  // LIVE中の配信者がいない場合
  if (liveStreamers.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-800/50 flex items-center justify-center">
          <Radio className="w-6 h-6 text-gray-600" />
        </div>
        <p className="text-gray-500 text-sm">
          現在LIVE中の配信者は<br />いません
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {liveStreamers.map((streamer, index) => (
        <button
          key={streamer.id}
          onClick={() => handleClickStreamer(streamer.streamerLogin)}
          className={`
            w-full p-2 rounded-lg bg-gray-900/50 hover:bg-gray-800/70
            transition-all duration-200 group cursor-pointer
            ${showCards ? 'animate-card' : 'opacity-0'}
          `}
          style={showCards ? { animationDelay: `${index * ANIMATION.CARD_DELAY_STEP}ms` } : undefined}
        >
          <div className="flex items-center gap-3">
            {/* プロフィール画像 */}
            <div className="relative flex-shrink-0">
              {streamer.streamerImage ? (
                <img
                  src={streamer.streamerImage}
                  alt={streamer.streamerName}
                  className="w-10 h-10 rounded-full ring-2 ring-red-500"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center ring-2 ring-red-500">
                  <span className="text-sm text-white font-bold">
                    {streamer.streamerName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              {/* LIVEインジケーター */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-[#1a1a1a] animate-pulse" />
            </div>

            {/* 配信者情報 */}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-gray-100 truncate">
                  {streamer.streamerName}
                </span>
                <Badge className="bg-red-600 text-white text-[10px] px-1.5 py-0 flex-shrink-0">
                  LIVE
                </Badge>
              </div>
              <div className="text-xs text-gray-500 truncate">
                @{streamer.streamerLogin}
              </div>
            </div>

            {/* Twitchアイコン */}
            <Twitch className="w-4 h-4 text-purple-500 group-hover:text-purple-400 transition-colors flex-shrink-0" />
          </div>
        </button>
      ))}
    </div>
  );
}
