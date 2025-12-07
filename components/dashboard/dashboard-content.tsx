// 適用スキル: component-creator
// 適用ルール:
// - セクション2: 技術スタック（React Query）
// - セクション4.6: コンポーネント構造
// - セクション10.2: サーバー/クライアントコンポーネント分離
// - YouTube風レイアウト: コンテンツのみ（ヘッダー・サイドバーはレイアウトにあり）

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';

import { ClipGrid } from '@/components/clips/clip-grid';
import { ClipSortTabs } from '@/components/dashboard/clip-sort-tabs';
import { Input } from '@/components/ui/input';
import { Toast } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { OnboardingModal } from '@/components/onboarding/onboarding-modal';
import { useFolderContext } from '@/components/layout/authenticated-layout';
import { getFolders } from '@/actions/folders';

import { useDashboardClips } from '@/hooks/use-dashboard-clips';
import { LABELS } from '@/lib/constants';

import type { Folder } from '@/types/database';

interface DashboardContentProps {
  userId: string | null;
  userEmail: string | null;
  isAuthenticated: boolean;
  skipAuth: boolean;
}

export function DashboardContent({ userId, userEmail, isAuthenticated, skipAuth }: DashboardContentProps) {
  // カスタムフックでクリップロジックを管理
  const {
    allClips,
    filteredClips,
    isLoadingClips,
    searchQuery,
    sortType,
    likedClipIds,
    setSearchQuery,
    setSortType,
    handleLikeToggle: handleLikeToggleHook,
  } = useDashboardClips();

  // UI State
  const { toast, showToast, hideToast } = useToast();

  // レイアウトからフォルダ選択状態を取得
  const { selectedFolderId, setSelectedFolderId } = useFolderContext();

  // オンボーディングモーダル表示制御
  const [showOnboarding, setShowOnboarding] = useState(!isAuthenticated || skipAuth);

  // ログイン済み + お気に入り配信者が0人の場合、自動でモーダル表示
  useEffect(() => {
    if (isAuthenticated && allClips.length === 0 && !isLoadingClips) {
      setShowOnboarding(true);
    }
  }, [isAuthenticated, allClips.length, isLoadingClips]);

  // フォルダ一覧を取得
  const { data: foldersResult } = useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      return await getFolders();
    },
  });

  const folders: Folder[] = foldersResult?.data || [];

  // 選択されたフォルダの配信者IDを取得
  const selectedFolderStreamerIds = useMemo(() => {
    if (!selectedFolderId) return null;
    const folder = folders.find(f => f.id === selectedFolderId);
    if (!folder || !folder.folderStreamers) return [];
    return folder.folderStreamers.map(fs => fs.streamerId);
  }, [selectedFolderId, folders]);

  // フォルダフィルタリング適用
  const displayClips = useMemo(() => {
    if (!selectedFolderStreamerIds) return filteredClips;
    return filteredClips.filter(clip =>
      selectedFolderStreamerIds.includes(clip.broadcaster_id)
    );
  }, [filteredClips, selectedFolderStreamerIds]);

  // いいね/解除（楽観的UI、即座に実行）
  const handleLikeToggle = (clipId: string, isCurrentlyLiked: boolean) => {
    handleLikeToggleHook(clipId, isCurrentlyLiked);
  };

  return (
    <div className="w-full px-3 py-4 pb-24 lg:pb-4">
      {/* 検索バー */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder={LABELS.PLACEHOLDERS.SEARCH_CLIPS}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#1a1a1a] border-0 text-gray-100 placeholder-gray-400 w-full"
          />
        </div>
      </div>

      {/* ソートタブ + フォルダタグ */}
      <div className="mb-6">
        <ClipSortTabs
          sortType={sortType}
          onSortChange={setSortType}
          clipCount={filteredClips.length}
          folders={folders}
          selectedFolderId={selectedFolderId}
          onFolderClick={setSelectedFolderId}
        />
      </div>

      {/* クリップグリッド */}
      <ClipGrid
        clips={displayClips}
        isLoading={isLoadingClips}
        likedClipIds={likedClipIds}
        onLikeToggle={handleLikeToggle}
      />

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
