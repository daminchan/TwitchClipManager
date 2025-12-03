// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション10.2: サーバー/クライアントコンポーネント分離

'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { FavoriteList } from '@/components/streamers/favorite-list';
import { Toast } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { useFavoriteActions } from '@/hooks/use-favorite-actions';

import type { TwitchChannel } from '@/types/twitch';

export function FavoritesContent() {
  const queryClient = useQueryClient();
  const { toast, showToast, hideToast } = useToast();
  const { handleAddFavorite: addFavorite } = useFavoriteActions();

  // サイドバー制御
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // お気に入り配信者を追加
  const handleAddFavorite = async (streamer: TwitchChannel) => {
    await addFavorite(
      streamer,
      (message) => showToast(message, 'success'),
      (message, type) => showToast(message, type)
    );
  };

  // お気に入り配信者を削除したときのハンドラー
  const handleRemoveFavorite = async () => {
    // React Query のキャッシュを無効化して自動再取得
    await queryClient.invalidateQueries({
      queryKey: ['clips', 'favorites'],
      refetchType: 'active'
    });
    await queryClient.invalidateQueries({ queryKey: ['favorites'] });
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        {/* 左サイドバー */}
        <DashboardSidebar
          isSidebarOpen={isSidebarOpen}
          onAddFavorite={handleAddFavorite}
          onRemoveFavorite={handleRemoveFavorite}
        />

        {/* メインコンテンツ */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-8 pb-24 lg:pb-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-100 mb-2">お気に入り配信者</h1>
              <p className="text-gray-400">
                お気に入りの配信者を管理できます
              </p>
            </div>

            <FavoriteList
              onRemoveFavorite={handleRemoveFavorite}
            />
          </div>
        </main>
      </div>

      <MobileNav />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
}
