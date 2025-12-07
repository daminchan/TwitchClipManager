// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション10.2: サーバー/クライアントコンポーネント分離
// - サーバーアクションの使用

'use client';

import { useState, useMemo, useTransition } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { PlaylistCard } from '@/components/clips/playlist-card';
import { ClipList } from '@/components/clips/clip-list';
import { ClipPlayerModal } from '@/components/clips/clip-player-modal';
import { Toast } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { useFavoriteActions } from '@/hooks/use-favorite-actions';
import { CACHE_TIME } from '@/lib/constants';

import type { LikedClip } from '@/types/database';
import type { TwitchClip, TwitchChannel } from '@/types/twitch';
import { getLikedClips, removeLikedClip } from '@/actions/liked-clips';

export function FavoritesClipsContent() {
  const queryClient = useQueryClient();
  const [deletingClipId, setDeletingClipId] = useState<string | undefined>(undefined);
  const { toast, showToast, hideToast } = useToast();
  const { handleAddFavorite: addFavorite } = useFavoriteActions();

  // サイドバー制御
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // クリップナビゲーション用の state
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // モバイル用モーダル制御
  const [isModalOpen, setIsModalOpen] = useState(false);

  // React Queryでいいねクリップを取得（キャッシュ有効）
  const { data: likedClipsData, isLoading } = useQuery({
    queryKey: ['clips', 'liked'],
    queryFn: async () => {
      const result = await getLikedClips();
      if (!result.success || !result.data) {
        throw new Error('いいねしたクリップの取得に失敗しました');
      }
      return result.data;
    },
    staleTime: CACHE_TIME.STREAMERS, // 5分間キャッシュ
  });

  // LikedClip を TwitchClip 形式に変換（useMemoで最適化）
  const likedClips = useMemo(() => {
    if (!likedClipsData) return [];

    return likedClipsData.map((liked: LikedClip) => ({
      id: liked.clipId,
      url: liked.clipUrl,
      embed_url: liked.clipEmbedUrl,
      broadcaster_id: liked.broadcasterId,
      broadcaster_name: liked.broadcasterName,
      creator_id: '',
      creator_name: liked.creatorName,
      video_id: '',
      game_id: '',
      language: '',
      title: liked.clipTitle,
      view_count: liked.viewCount,
      created_at: liked.clipCreatedAt,
      thumbnail_url: liked.thumbnailUrl,
      duration: liked.duration,
      vod_offset: null,
    }));
  }, [likedClipsData]);

  const likedClipIds = useMemo(() => {
    if (!likedClipsData) return new Set<string>();
    return new Set(likedClipsData.map((clip: LikedClip) => clip.clipId));
  }, [likedClipsData]);

  // いいね削除のミューテーション
  const deleteMutation = useMutation({
    mutationFn: async (clipId: string) => {
      return await removeLikedClip(clipId);
    },
    onSuccess: (result) => {
      if (result.success) {
        // キャッシュを無効化して最新データを取得
        queryClient.invalidateQueries({ queryKey: ['clips', 'liked'] });
        showToast(result.message, 'info');
      } else {
        showToast(result.message, 'error');
      }
    },
    onError: (error) => {
      console.error('Delete liked clip error:', error);
      showToast('いいねの削除に失敗しました', 'error');
    },
  });

  const handleDelete = async (clipId: string) => {
    setDeletingClipId(clipId);
    await deleteMutation.mutateAsync(clipId);
    setDeletingClipId(undefined);
  };

  // 現在のクリップを取得
  const currentClip = likedClips.length > 0 && currentIndex >= 0 && currentIndex < likedClips.length
    ? likedClips[currentIndex]
    : null;

  // 次のクリップへ
  const handleNext = () => {
    if (currentIndex < likedClips.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // 前のクリップへ
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // クリップを選択（PC版）
  const handleSelectClip = (clipId: string) => {
    const index = likedClips.findIndex(clip => clip.id === clipId);
    if (index !== -1) {
      setCurrentIndex(index);
    }
  };

  // クリップを選択してモーダルを開く（モバイル版）
  const handleSelectClipMobile = (clipId: string) => {
    const index = likedClips.findIndex(clip => clip.id === clipId);
    if (index !== -1) {
      setCurrentIndex(index);
      setIsModalOpen(true);
    }
  };

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
          <div className="p-6 pb-24 lg:pb-6">
            {/* 2カラムレイアウト（PC版） */}
            <div className="hidden lg:flex gap-6">
              {/* 左側：プレイリストカード */}
              <div className="w-[400px] flex-shrink-0">
                <PlaylistCard
                  title="お気に入りクリップ"
                  clipCount={likedClips.length}
                  currentClip={currentClip}
                  currentIndex={currentIndex}
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                  isLoading={isLoading}
                />
              </div>

              {/* 右側：クリップリスト */}
              <div className="flex-1">
                <ClipList
                  clips={likedClips}
                  onDelete={handleDelete}
                  onSelectClip={handleSelectClip}
                  deletingClipId={deletingClipId}
                  currentClipId={currentClip?.id}
                  isLoading={isLoading}
                />
              </div>
            </div>

            {/* モバイル版 */}
            <div className="lg:hidden">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-100 mb-2">お気に入りクリップ</h1>
                <p className="text-gray-400">
                  あとで見返したいクリップを保存できます（{likedClips.length}件）
                </p>
              </div>

              <ClipList
                clips={likedClips}
                onDelete={handleDelete}
                onSelectClip={handleSelectClipMobile}
                deletingClipId={deletingClipId}
                currentClipId={currentClip?.id}
                isLoading={isLoading}
              />
            </div>
          </div>
        </main>
      </div>

      <MobileNav />

      {/* モバイル用モーダルプレーヤー */}
      <ClipPlayerModal
        clip={currentClip}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onNext={handleNext}
        onPrevious={handlePrevious}
        currentIndex={currentIndex}
        totalClips={likedClips.length}
      />

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
