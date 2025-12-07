// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション10.2: サーバー/クライアントコンポーネント分離
// - YouTube風レイアウト: コンテンツのみ

'use client';

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { useDraggable } from '@dnd-kit/core';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { API_ENDPOINTS, ROUTES } from '@/lib/constants';

import type { FavoriteStreamer } from '@/types/database';

export function FavoritesContent() {
  // お気に入り配信者を取得（サイドバーと同じキャッシュを使用）
  const { data: favorites = [], isLoading } = useQuery<FavoriteStreamer[]>({
    queryKey: ['favorites'],
    queryFn: async () => {
      const res = await fetch(API_ENDPOINTS.FAVORITES, {
        cache: 'no-store',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch favorites');
      const result = await res.json();
      return result.data as FavoriteStreamer[];
    },
  });

  return (
    <div className="w-full px-3 py-4 pb-24 lg:pb-4">
      {/* 戻るボタン */}
      <div className="mb-6">
        <Link href={ROUTES.DASHBOARD}>
          <Button
            variant="ghost"
            className="text-gray-400 hover:text-gray-100 hover:bg-[#1a1a1a] button-press-feedback"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            クリップ一覧に戻る
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          お気に入り配信者
        </h1>
        <p className="text-gray-400">
          カードをドラッグしてフォルダに追加できます
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="bg-[#1a1a1a] rounded-lg p-4 animate-pulse"
            >
              <div className="w-24 h-24 bg-gray-700 rounded-full mx-auto mb-3"></div>
              <div className="h-4 bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 mb-4">お気に入り配信者がまだいません</p>
          <p className="text-sm text-gray-500">
            サイドバーから配信者を追加してください
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {favorites.map((favorite) => (
            <DraggableStreamerCard
              key={favorite.id}
              favorite={favorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ドラッグ可能な配信者カード
interface DraggableStreamerCardProps {
  favorite: FavoriteStreamer;
}

function DraggableStreamerCard({ favorite }: DraggableStreamerCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: favorite.id,
    data: {
      streamer: favorite,
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={isDragging ? 'opacity-10' : ''}
    >
      <div className="group bg-[#1a1a1a] hover:bg-[#222222] rounded-lg p-4 cursor-move transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20">
        {/* プロフィール画像 */}
        <div className="relative w-24 h-24 mx-auto mb-3">
          {favorite.streamerImage ? (
            <Image
              src={favorite.streamerImage}
              alt={favorite.streamerName}
              fill
              className="rounded-full object-cover"
              sizes="96px"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-purple-600 flex items-center justify-center">
              <span className="text-2xl text-white font-bold">
                {favorite.streamerName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* 配信者名 */}
        <p className="text-center text-sm font-semibold text-gray-100 line-clamp-1 mb-1">
          {favorite.streamerName}
        </p>
        <p className="text-center text-xs text-gray-400 line-clamp-1">
          @{favorite.streamerLogin}
        </p>
      </div>
    </div>
  );
}
