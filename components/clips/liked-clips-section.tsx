// - サーバーアクションの使用

'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ClipGrid } from './clip-grid';
import { Toast } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import type { LikedClip } from '@/types/database';
import type { TwitchClip } from '@/types/twitch';
import { getLikedClips, removeLikedClip } from '@/actions/liked-clips';

export function LikedClipsSection() {
  const [likedClips, setLikedClips] = useState<TwitchClip[]>([]);
  const [likedClipIds, setLikedClipIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const { toast, showToast, hideToast } = useToast();
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
        creator_id: '', // データベースに保存していない
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

      showToast('いいねしたクリップの読み込みに失敗しました', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikeToggle = async (clipId: string, isCurrentlyLiked: boolean) => {
    if (!isCurrentlyLiked) return; // いいね追加はここではしない（dashboard のみ）

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
        showToast(result.message, 'info');
      } else {
        showToast(result.message, 'error');
      }
    });
  };

  useEffect(() => {
    fetchLikedClips();
  }, []);

  return (
    <>
      <Card className="bg-white border-0">
        <CardHeader>
          <CardTitle className="text-gray-900">いいねしたクリップ</CardTitle>
          <CardDescription className="text-gray-500">
            あとで見返したいクリップを保存できます（{likedClips.length}件）
          </CardDescription>
        </CardHeader>
        <CardContent>
          {likedClips.length === 0 && !isLoading ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-5xl mb-3">💜</div>
              <p>まだいいねしたクリップがありません</p>
              <p className="text-sm mt-2">ダッシュボードでクリップにいいねしてみましょう</p>
            </div>
          ) : (
            <ClipGrid
              clips={likedClips}
              isLoading={isLoading}
              likedClipIds={likedClipIds}
              onLikeToggle={handleLikeToggle}
            />
          )}
        </CardContent>
      </Card>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </>
  );
}
