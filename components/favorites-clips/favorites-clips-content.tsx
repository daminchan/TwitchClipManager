// - サーバーアクションの使用
// - YouTube風レイアウト: コンテンツのみ

'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

import { PlaylistCard } from '@/components/clips/playlist-card';
import { ClipList } from '@/components/clips/clip-list';
import { ClipPlayerModal } from '@/components/clips/clip-player-modal';
import { Toast } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { CACHE_TIME, PAGINATION } from '@/lib/constants';

import type { LikedClip } from '@/types/database';
import type { TwitchClip } from '@/types/twitch';
import { getLikedClips, removeLikedClip } from '@/actions/liked-clips';

export function FavoritesClipsContent() {
  const queryClient = useQueryClient();
  const [deletingClipId, setDeletingClipId] = useState<string | undefined>(undefined);
  const { toast, showToast, hideToast } = useToast();

  // クリップナビゲーション用の state
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // モバイル用モーダル制御
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 無限スクロール用ページネーション
  const [displayedCount, setDisplayedCount] = useState<number>(PAGINATION.LIKED_CLIPS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

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

  // 表示するクリップ（ページネーション適用）
  const displayedClips = useMemo(() => {
    return likedClips.slice(0, displayedCount);
  }, [likedClips, displayedCount]);

  // もっと読み込む
  const handleLoadMore = useCallback(() => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayedCount(prev => prev + PAGINATION.LIKED_CLIPS_PER_PAGE);
      setIsLoadingMore(false);
    }, 300);
  }, []);

  const hasMore = displayedCount < likedClips.length;

  // いいね削除のミューテーション
  // 楽観的UI: 即座にリストから削除 → バックグラウンドでDB削除
  const deleteMutation = useMutation({
    mutationFn: async (clipId: string) => {
      return await removeLikedClip(clipId);
    },
    onMutate: async (clipId: string) => {
      // 楽観的UI: 即座にキャッシュから削除
      await queryClient.cancelQueries({ queryKey: ['clips', 'liked'] });

      // 以前のデータを保存（ロールバック用）
      const previousData = queryClient.getQueryData(['clips', 'liked']);

      // キャッシュを楽観的に更新（即座にリストから消える）
      queryClient.setQueryData(['clips', 'liked'], (old: LikedClip[] | undefined) => {
        if (!old) return old;
        return old.filter((clip) => clip.clipId !== clipId);
      });

      return { previousData };
    },
    onSuccess: (result) => {
      if (result.success) {
        showToast(result.message, 'info');
      } else {
        // 失敗時はキャッシュを再取得してロールバック
        queryClient.invalidateQueries({ queryKey: ['clips', 'liked'] });
        showToast(result.message, 'error');
      }
    },
    onError: (error, clipId, context) => {
      console.error('Delete liked clip error:', error);
      // エラー時はロールバック
      if (context?.previousData) {
        queryClient.setQueryData(['clips', 'liked'], context.previousData);
      }
      showToast('いいねの削除に失敗しました', 'error');
    },
  });

  const handleDelete = async (clipId: string) => {
    // 楽観的UIなので削除中表示は不要、即座に削除
    setDeletingClipId(clipId);
    try {
      await deleteMutation.mutateAsync(clipId);
    } finally {
      setDeletingClipId(undefined);
    }
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

  return (
    <div className="px-3 py-4 pb-24 lg:pb-4">
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

        {/* 右側：クリップリスト（無限スクロール対応） */}
        <div className="flex-1">
          <ClipList
            clips={displayedClips}
            onDelete={handleDelete}
            onSelectClip={handleSelectClip}
            deletingClipId={deletingClipId}
            currentClipId={currentClip?.id}
            isLoading={isLoading}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            isLoadingMore={isLoadingMore}
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
          clips={displayedClips}
          onDelete={handleDelete}
          onSelectClip={handleSelectClipMobile}
          deletingClipId={deletingClipId}
          currentClipId={currentClip?.id}
          isLoading={isLoading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          isLoadingMore={isLoadingMore}
        />
      </div>

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

      {/* トースト通知 */}
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
