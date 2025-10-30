// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション10.2: サーバー/クライアントコンポーネント分離
// - サーバーアクションの使用

'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';

import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { ClipSortTabs } from '@/components/dashboard/clip-sort-tabs';
import { ClipFilterTabs } from '@/components/dashboard/clip-filter-tabs';
import { StreamerSearch } from '@/components/streamers/streamer-search';
import { FavoriteList } from '@/components/streamers/favorite-list';
import { ClipGrid } from '@/components/clips/clip-grid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toast } from '@/components/ui/toast';

import { useDashboardClips } from '@/hooks/use-dashboard-clips';
import { LABELS, ROUTES, ClipFilterType } from '@/lib/constants';
import { addFavoriteStreamer } from '@/actions/favorites';

import type { TwitchChannel } from '@/types/twitch';

interface DashboardContentProps {
  userId: string;
  userEmail: string;
}

export function DashboardContent({ userId, userEmail }: DashboardContentProps) {
  const router = useRouter();

  // カスタムフックでクリップロジックを管理
  const {
    filteredClips,
    isLoadingClips,
    clipError,
    searchQuery,
    sortType,
    clipFilter,
    likedClipIds,
    setSearchQuery,
    setSortType,
    setClipFilter,
    fetchAllFavoriteClips,
    fetchLikedClips,
    handleLikeToggle: handleLikeToggleHook,
  } = useDashboardClips();

  // UI State
  const [refreshFavorites, setRefreshFavorites] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileFavorites, setShowMobileFavorites] = useState(false);
  const [isPending, startTransition] = useTransition();

  // お気に入り配信者を追加
  const handleAddFavorite = async (streamer: TwitchChannel) => {
    startTransition(async () => {
      // サーバーアクションでお気に入りを追加
      const result = await addFavoriteStreamer(
        streamer.id,
        streamer.display_name,
        streamer.broadcaster_login,
        streamer.thumbnail_url.replace('{width}', '300').replace('{height}', '300')
      );

      if (result.success) {
        setToast({ message: result.message, type: 'success' });
        setRefreshFavorites((prev) => prev + 1);
      } else {
        setToast({
          message: result.message,
          type: result.error === 'Already exists' ? 'info' : 'error'
        });
      }
    });
  };

  // いいね/解除のラッパー（トースト表示付き）
  const handleLikeToggle = async (clipId: string, isCurrentlyLiked: boolean) => {
    const result = await handleLikeToggleHook(clipId, isCurrentlyLiked);
    if (result) {
      setToast({
        message: result.message,
        type: result.success ? (isCurrentlyLiked ? 'info' : 'success') : 'error'
      });
    }
  };

  // フィルター変更時にクリップを再取得
  const handleFilterChange = (filter: ClipFilterType) => {
    setClipFilter(filter);
    fetchAllFavoriteClips(filter);
  };

  // お気に入り全員のクリップを取得（初回 + お気に入り更新時 + フィルター変更時）
  useEffect(() => {
    fetchAllFavoriteClips();
    fetchLikedClips();
  }, [refreshFavorites]);

  // モバイル検索・お気に入りイベントリスナー
  useEffect(() => {
    const handleOpenMobileSearch = () => setShowMobileSearch(true);
    const handleToggleFavorites = () => setShowMobileFavorites(!showMobileFavorites);

    window.addEventListener('openMobileSearch', handleOpenMobileSearch);
    window.addEventListener('toggleFavorites', handleToggleFavorites);

    return () => {
      window.removeEventListener('openMobileSearch', handleOpenMobileSearch);
      window.removeEventListener('toggleFavorites', handleToggleFavorites);
    };
  }, [showMobileFavorites]);

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        {/* 左サイドバー */}
        <DashboardSidebar
          isSidebarOpen={isSidebarOpen}
          onAddFavorite={handleAddFavorite}
          refreshTrigger={refreshFavorites}
        />

        {/* メインコンテンツ */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 pb-24 lg:pb-6">
            {/* 検索バーとフィルター */}
            <div className="mb-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder={LABELS.PLACEHOLDERS.SEARCH_CLIPS}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-[#1a1a1a] border-0 text-gray-100 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* クリップフィルタータブ */}
              <ClipFilterTabs
                currentFilter={clipFilter}
                onFilterChange={handleFilterChange}
                clipCount={filteredClips.length}
              />

              {/* ソートタブ */}
              <ClipSortTabs
                sortType={sortType}
                onSortChange={setSortType}
                clipCount={filteredClips.length}
              />
            </div>

            {/* クリップグリッド */}
            <div>
              {clipError && (
                <div className="bg-yellow-900/30 border border-yellow-700/50 text-yellow-400 text-sm p-4 rounded-lg mb-4">
                  {clipError}
                </div>
              )}

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

      {/* モバイルお気に入りモーダル */}
      {showMobileFavorites && (
        <div className="lg:hidden fixed inset-0 z-[60] bg-[#0f0f0f] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
            <h2 className="text-lg font-semibold text-gray-100">{LABELS.SECTIONS.FAVORITE_STREAMERS}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobileFavorites(false)}
              className="text-gray-400"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <FavoriteList
              onSelectStreamer={() => setShowMobileFavorites(false)}
              refreshTrigger={refreshFavorites}
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
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
