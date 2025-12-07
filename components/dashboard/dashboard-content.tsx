// 適用スキル: component-creator
// 適用ルール:
// - セクション2: 技術スタック（React Query）
// - セクション4.6: コンポーネント構造
// - セクション10.2: サーバー/クライアントコンポーネント分離
// - サーバーアクションの使用

'use client';

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';

import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { StreamerSearch } from '@/components/streamers/streamer-search';
import { ClipGrid } from '@/components/clips/clip-grid';
import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { useFavoriteActions } from '@/hooks/use-favorite-actions';
import { OnboardingModal } from '@/components/onboarding/onboarding-modal';

import { useDashboardClips } from '@/hooks/use-dashboard-clips';
import { LABELS } from '@/lib/constants';

import type { TwitchChannel } from '@/types/twitch';

interface DashboardContentProps {
  userId: string | null;
  userEmail: string | null;
  isAuthenticated: boolean;
  skipAuth: boolean;
}

export function DashboardContent({ userId, userEmail, isAuthenticated, skipAuth }: DashboardContentProps) {
  const queryClient = useQueryClient();

  // カスタムフックでクリップロジックを管理
  const {
    allClips,
    filteredClips,
    isLoadingClips,
    clipError,
    searchQuery,
    sortType,
    likedClipIds,
    setSearchQuery,
    setSortType,
    handleLikeToggle: handleLikeToggleHook,
  } = useDashboardClips();

  // UI State
  const { toast, showToast, hideToast } = useToast();
  const { handleAddFavorite: addFavorite } = useFavoriteActions();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // オンボーディングモーダル表示制御
  const [showOnboarding, setShowOnboarding] = useState(!isAuthenticated || skipAuth);

  // ログイン済み + お気に入り配信者が0人の場合、自動でモーダル表示
  useEffect(() => {
    if (isAuthenticated && allClips.length === 0 && !isLoadingClips) {
      setShowOnboarding(true);
    }
  }, [isAuthenticated, allClips.length, isLoadingClips]);

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

  // いいね/解除（楽観的UI、即座に実行）
  const handleLikeToggle = (clipId: string, isCurrentlyLiked: boolean) => {
    handleLikeToggleHook(clipId, isCurrentlyLiked);
  };

  // モバイル検索イベントリスナー
  useEffect(() => {
    const handleOpenMobileSearch = () => setShowMobileSearch(true);

    window.addEventListener('openMobileSearch', handleOpenMobileSearch);

    return () => {
      window.removeEventListener('openMobileSearch', handleOpenMobileSearch);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      <Header
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        showDashboardControls={true}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortType={sortType}
        setSortType={setSortType}
        clipCount={filteredClips.length}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* 左サイドバー */}
        <DashboardSidebar
          isSidebarOpen={isSidebarOpen}
          onAddFavorite={handleAddFavorite}
          onRemoveFavorite={handleRemoveFavorite}
        />

        {/* メインコンテンツ */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 pb-24 lg:pb-6">
            {/* クリップグリッド */}
            <div>
              <ClipGrid
                clips={filteredClips}
                isLoading={isLoadingClips}
                likedClipIds={likedClipIds}
                onLikeToggle={handleLikeToggle}
              />
            </div>
          </div>
        </main>
      </div>

      {/* モバイル検索モーダル */}
      {showMobileSearch && (
        <div className="lg:hidden fixed inset-0 z-[60] bg-[#0f0f0f] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
            <h2 className="text-lg font-semibold text-gray-100">{LABELS.SECTIONS.SEARCH_STREAMERS}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobileSearch(false)}
              className="text-gray-400"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <StreamerSearch
              onSelectStreamer={(streamer) => {
                handleAddFavorite(streamer);
                setShowMobileSearch(false);
              }}
            />
          </div>
        </div>
      )}

      {/* モバイルフッターナビゲーション */}
      <MobileNav />

      {/* トースト通知 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      {/* オンボーディングモーダル */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        skipAuth={isAuthenticated}
      />
    </div>
  );
}
