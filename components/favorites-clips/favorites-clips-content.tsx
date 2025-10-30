// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション10.2: サーバー/クライアントコンポーネント分離
// - サーバーアクションの使用

'use client';

import { useState, useEffect, useTransition } from 'react';

import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { ClipGrid } from '@/components/clips/clip-grid';
import { Toast } from '@/components/ui/toast';

import type { LikedClip } from '@/types/database';
import type { TwitchClip } from '@/types/twitch';
import { getLikedClips, removeLikedClip } from '@/actions/liked-clips';

export function FavoritesClipsContent() {
  const [likedClips, setLikedClips] = useState<TwitchClip[]>([]);
  const [likedClipIds, setLikedClipIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchLikedClips = async () => {
    setIsLoading(true);
    try {
      // サーバーアクションでいいねクリップを取得
      const result = await getLikedClips();

      if (!result.success || !result.data) {
        throw new Error('いいねしたクリップの取得に失敗しました');
      }

      // LikedClip を TwitchClip 形式に変換
      const convertedClips: TwitchClip[] = result.data.map((liked: LikedClip) => ({
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

      setLikedClips(convertedClips);
      setLikedClipIds(new Set(result.data.map((clip: LikedClip) => clip.clipId)));
    } catch (error) {
      console.error('Fetch liked clips error:', error);
      setToast({ message: 'いいねしたクリップの読み込みに失敗しました', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikeToggle = async (clipId: string, isCurrentlyLiked: boolean) => {
    if (!isCurrentlyLiked) return; // いいね追加はダッシュボードのみ

    startTransition(async () => {
      // サーバーアクションでいいねを解除
      const result = await removeLikedClip(clipId);

      if (result.success) {
        // リストから削除
        setLikedClips((prev) => prev.filter((clip) => clip.id !== clipId));
        setLikedClipIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(clipId);
          return newSet;
        });
        setToast({ message: result.message, type: 'info' });
      } else {
        setToast({ message: result.message, type: 'error' });
      }
    });
  };

  useEffect(() => {
    fetchLikedClips();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      <Header />

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8 pb-24 lg:pb-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-100 mb-2">お気に入りクリップ</h1>
            <p className="text-gray-400">
              あとで見返したいクリップを保存できます（{likedClips.length}件）
            </p>
          </div>

          {likedClips.length === 0 && !isLoading ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-6xl mb-4">💜</div>
              <p className="text-lg mb-2">まだお気に入りクリップがありません</p>
              <p className="text-sm">ダッシュボードでクリップにいいねしてみましょう</p>
            </div>
          ) : (
            <ClipGrid
              clips={likedClips}
              isLoading={isLoading}
              likedClipIds={likedClipIds}
              onLikeToggle={handleLikeToggle}
            />
          )}
        </div>
      </main>

      <MobileNav />

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
