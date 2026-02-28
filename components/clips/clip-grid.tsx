// 機能: クリップのグリッド表示（無限スクロール対応）

'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

import { ClipCard } from './clip-card';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { LABELS, ANIMATION } from '@/lib/constants';
import type { TwitchClip } from '@/types/twitch';

interface ClipGridProps {
  clips: TwitchClip[];
  isLoading?: boolean;
  likedClipIds?: Set<string>;
  onLikeToggle?: (clipId: string, isCurrentlyLiked: boolean) => void;
  /** 無限スクロール: さらに読み込むデータがあるか */
  hasMore?: boolean;
  /** 無限スクロール: 追加読み込み時のコールバック */
  onLoadMore?: () => void;
  /** 無限スクロール: 読み込み中かどうか */
  isLoadingMore?: boolean;
}

/**
 * クリップグリッドコンポーネント
 * クリップカードをグリッドレイアウトで表示
 * 無限スクロールに対応（Intersection Observer使用）
 */
export function ClipGrid({
  clips,
  isLoading,
  likedClipIds,
  onLikeToggle,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
}: ClipGridProps) {
  // 初回表示アニメーション用（追加読み込み時はアニメーションしない）
  const [initialAnimationDone, setInitialAnimationDone] = useState(false);

  // 無限スクロール（useInfiniteScrollフック使用）
  const { loadMoreRef } = useInfiniteScroll({
    hasMore,
    onLoadMore: onLoadMore ?? (() => {}),
  });

  // 初回マウント後、アニメーション開始→完了
  useEffect(() => {
    const timer = setTimeout(
      () => setInitialAnimationDone(true),
      ANIMATION.GRID_INITIAL_DELAY
    );
    return () => clearTimeout(timer);
  }, []);

  // ローディング中: スケルトン表示
  if (isLoading) {
    return (
      <div className="grid-clips">
        {Array.from({ length: ANIMATION.GRID_SKELETON_COUNT }).map((_, i) => (
          <div
            key={i}
            className="aspect-video bg-gray-800 animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  // クリップなし: 空状態表示
  if (clips.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="text-6xl mb-4">📺</div>
        <p className="text-lg">{LABELS.MESSAGES.NO_CLIPS}</p>
      </div>
    );
  }

  return (
    <div>
      {/* クリップグリッド */}
      <div className="grid-clips">
        {clips.map((clip) => (
          <div
            key={clip.id}
            className={initialAnimationDone ? '' : 'animate-card'}
          >
            <ClipCard
              clip={clip}
              isLiked={likedClipIds?.has(clip.id)}
              onLikeToggle={onLikeToggle}
            />
          </div>
        ))}
      </div>

      {/* 無限スクロール: ローディング & トリガー */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          {isLoadingMore ? (
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{LABELS.BUTTONS.LOADING}</span>
            </div>
          ) : (
            <div className="h-8" /> // トリガー用の空要素
          )}
        </div>
      )}
    </div>
  );
}
