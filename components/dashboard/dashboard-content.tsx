// - YouTube風レイアウト: コンテンツのみ（ヘッダー・サイドバーはレイアウトにあり）
// 機能: ダッシュボードのメインコンテンツ（3セクション表示、検索、ソート）

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { Search, Flame, Sparkles } from 'lucide-react';

import { ClipGrid } from '@/components/clips/clip-grid';
import { ClipSortTabs } from '@/components/dashboard/clip-sort-tabs';
import { SectionHeader } from '@/components/dashboard/section-header';
import { RankingSection } from '@/components/dashboard/ranking-section';
import { HotSection } from '@/components/dashboard/hot-section';
import { Input } from '@/components/ui/input';
import { Toast } from '@/components/ui/toast';

// 初回表示に不要なモーダルを遅延読み込み（ルール2.4: Dynamic Imports）
const OnboardingModal = dynamic(
  () => import('@/components/onboarding/onboarding-modal').then(m => ({ default: m.OnboardingModal })),
  { ssr: false }
);
const RegistrationPromptModal = dynamic(
  () => import('@/components/auth/registration-prompt-modal').then(m => ({ default: m.RegistrationPromptModal })),
  { ssr: false }
);
import { useToast } from '@/hooks/use-toast';
import { useDashboardClips } from '@/hooks/use-dashboard-clips';
import { usePopularClips } from '@/hooks/use-popular-clips';
import { useHomeSections } from '@/hooks/use-home-sections';
import { useFolderContext } from '@/components/layout/authenticated-layout';
import { getFolders } from '@/actions/folders';
import { LABELS, PAGINATION } from '@/lib/constants';
import type { Folder } from '@/types/database';

interface DashboardContentProps {
  userId: string | null;
  userEmail: string | null;
  isAuthenticated: boolean;
  skipAuth: boolean;
}

/**
 * ダッシュボードコンテンツコンポーネント
 * クリップ一覧の表示、検索、ソート、フィルタリング機能を提供
 * デフォルトは3セクション表示、検索/フォルダ選択時は1グリッド表示
 */
export function DashboardContent({
  userId,
  userEmail,
  isAuthenticated,
  skipAuth,
}: DashboardContentProps) {
  // 認証済みユーザー用クリップ
  const dashboardClips = useDashboardClips({ enabled: isAuthenticated && !skipAuth });

  // 人気クリップ（常時取得、未認証/未登録時に表示）
  const popularClips = usePopularClips();

  // 認証状態に応じてどちらのクリップデータを使うか決定
  const usePopular = !isAuthenticated || skipAuth;
  const activeClips = usePopular ? popularClips : dashboardClips;

  // 3セクション振り分け
  const { ranking, hot, recommended } = useHomeSections({
    popularClips: popularClips.allClips,
    favoriteClips: isAuthenticated && !skipAuth ? dashboardClips.allClips : [],
    isAuthenticated: isAuthenticated && !skipAuth,
  });

  // UI State
  const { toast, showToast, hideToast } = useToast();
  const [showRegistrationPrompt, setShowRegistrationPrompt] = useState(false);

  // レイアウトからフォルダ選択状態を取得
  const { selectedFolderId, setSelectedFolderId } = useFolderContext();

  // オンボーディングモーダル表示制御（認証済み + お気に入り0人のみ）
  // 遅延初期化でuseEffectを排除（ルール5.1, 5.10）
  const [showOnboarding, setShowOnboarding] = useState(
    () => isAuthenticated && skipAuth
  );

  // フォルダ一覧を取得（認証済みのみ）
  const { data: foldersResult } = useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      return await getFolders();
    },
    enabled: isAuthenticated,
  });

  const folders: Folder[] = foldersResult?.data || [];

  // 選択されたフォルダの配信者IDをSetで取得（7.11: O(1) lookups）
  const selectedFolderStreamerIdSet = useMemo(() => {
    if (!selectedFolderId) return null;
    const folder = folders.find((f) => f.id === selectedFolderId);
    if (!folder || !folder.folderStreamers) return new Set<string>();
    return new Set(folder.folderStreamers.map((fs) => fs.streamerId));
  }, [selectedFolderId, folders]);

  // フォルダフィルタリング適用
  const allDisplayClips = useMemo(() => {
    if (!selectedFolderStreamerIdSet) return activeClips.filteredClips;
    return activeClips.filteredClips.filter((clip) =>
      selectedFolderStreamerIdSet.has(clip.broadcaster_id)
    );
  }, [activeClips.filteredClips, selectedFolderStreamerIdSet]);

  // フォルダフィルタを3セクションにも適用
  const filteredRanking = useMemo(() => {
    if (!selectedFolderStreamerIdSet) return ranking;
    return ranking.filter((clip) =>
      selectedFolderStreamerIdSet.has(clip.broadcaster_id)
    );
  }, [ranking, selectedFolderStreamerIdSet]);

  const filteredHot = useMemo(() => {
    if (!selectedFolderStreamerIdSet) return hot;
    return hot.filter((clip) =>
      selectedFolderStreamerIdSet.has(clip.broadcaster_id)
    );
  }, [hot, selectedFolderStreamerIdSet]);

  const filteredRecommended = useMemo(() => {
    if (!selectedFolderStreamerIdSet) return recommended;
    return recommended.filter((clip) =>
      selectedFolderStreamerIdSet.has(clip.broadcaster_id)
    );
  }, [recommended, selectedFolderStreamerIdSet]);

  // 3セクション表示するかどうか（検索なし時のみ。フォルダ選択時もセクションは維持）
  const showSections = !activeClips.searchQuery;

  // おすすめセクションにソートを適用
  const sortedRecommended = useMemo(() => {
    if (activeClips.sortType === 'date-desc') {
      return filteredRecommended.toSorted(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    if (activeClips.sortType === 'date-asc') {
      return filteredRecommended.toSorted(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }
    // 'views' はデフォルトの再生数順（useHomeSectionsで既にソート済み）
    return filteredRecommended;
  }, [filteredRecommended, activeClips.sortType]);

  // おすすめセクション用ページネーション
  const [displayedCount, setDisplayedCount] = useState<number>(
    PAGINATION.CLIPS_PER_PAGE
  );

  // フィルター変更時にページネーションをリセット
  useEffect(() => {
    setDisplayedCount(PAGINATION.CLIPS_PER_PAGE);
  }, [activeClips.searchQuery, activeClips.sortType, selectedFolderId]);

  // 表示するクリップ（ページネーション適用）
  const displayClips = useMemo(() => {
    if (showSections) {
      return sortedRecommended.slice(0, displayedCount);
    }
    return allDisplayClips.slice(0, displayedCount);
  }, [showSections, sortedRecommended, allDisplayClips, displayedCount]);

  // もっと読み込む
  const handleLoadMore = useCallback(() => {
    setDisplayedCount((prev) => prev + PAGINATION.CLIPS_PER_PAGE);
  }, []);

  const hasMore = showSections
    ? displayedCount < sortedRecommended.length
    : displayedCount < allDisplayClips.length;

  // いいね/解除（未認証時は登録促進モーダル表示）
  const handleLikeToggle = (clipId: string, isCurrentlyLiked: boolean) => {
    if (!isAuthenticated) {
      setShowRegistrationPrompt(true);
      return;
    }
    if ('handleLikeToggle' in dashboardClips) {
      dashboardClips.handleLikeToggle(clipId, isCurrentlyLiked);
    }
  };

  return (
    <div className="w-full px-3 py-4 pb-24 lg:pb-4">
      {/* 検索バー */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            type="text"
            placeholder={LABELS.PLACEHOLDERS.SEARCH_CLIPS}
            value={activeClips.searchQuery}
            onChange={(e) => activeClips.setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-0 text-gray-900 placeholder-gray-400 w-full"
          />
        </div>
      </div>

      {showSections ? (
        <>
          {/* ① 週間ランキング（ヘッダー内蔵） */}
          {filteredRanking.length > 0 ? (
            <section className="mb-8">
              <RankingSection
                clips={filteredRanking}
                likedClipIds={activeClips.likedClipIds}
                onLikeToggle={handleLikeToggle}
              />
            </section>
          ) : null}

          {/* ② HOT */}
          {filteredHot.length > 0 ? (
            <section className="mb-8">
              <SectionHeader
                title={LABELS.SECTIONS.HOT}
                icon={Flame}
                pillBg="bg-[#f0e4e0]"
                iconColor="text-[#c07060]"
                textColor="text-[#8a5848]"
              />
              <HotSection
                clips={filteredHot}
                likedClipIds={activeClips.likedClipIds}
                onLikeToggle={handleLikeToggle}
              />
            </section>
          ) : null}

          {/* ③ おすすめ */}
          <section>
            <SectionHeader
              title={LABELS.SECTIONS.RECOMMENDED}
              icon={Sparkles}
              pillBg="bg-[#e8e2ee]"
              iconColor="text-[#8868a8]"
              textColor="text-[#6a4880]"
            />

            {/* ソートタブ + フォルダタグ */}
            <div className="mb-6">
              <ClipSortTabs
                sortType={activeClips.sortType}
                onSortChange={activeClips.setSortType}
                clipCount={sortedRecommended.length}
                folders={isAuthenticated ? folders : []}
                selectedFolderId={selectedFolderId}
                onFolderClick={setSelectedFolderId}
              />
            </div>

            <ClipGrid
              clips={displayClips}
              isLoading={activeClips.isLoadingClips}
              likedClipIds={activeClips.likedClipIds}
              onLikeToggle={handleLikeToggle}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
            />
          </section>
        </>
      ) : (
        <>
          {/* 検索/フォルダ選択時: 従来通り1グリッド表示 */}
          <div className="mb-6">
            <ClipSortTabs
              sortType={activeClips.sortType}
              onSortChange={activeClips.setSortType}
              clipCount={allDisplayClips.length}
              folders={isAuthenticated ? folders : []}
              selectedFolderId={selectedFolderId}
              onFolderClick={setSelectedFolderId}
            />
          </div>

          <ClipGrid
            clips={displayClips}
            isLoading={activeClips.isLoadingClips}
            likedClipIds={activeClips.likedClipIds}
            onLikeToggle={handleLikeToggle}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
          />
        </>
      )}

      {/* トースト通知 */}
      {toast ? (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      ) : null}

      {/* オンボーディングモーダル（認証済み + お気に入り0人のみ） */}
      {isAuthenticated ? (
        <OnboardingModal
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          skipAuth={true}
        />
      ) : null}

      {/* 登録促進モーダル（未認証時にいいね等をクリック） */}
      <RegistrationPromptModal
        isOpen={showRegistrationPrompt}
        onClose={() => setShowRegistrationPrompt(false)}
      />
    </div>
  );
}
