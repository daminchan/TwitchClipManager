// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション8.2: Props型定義
// - セクション5.3: レスポンシブデザイン（モバイルファースト）
// - 無限スクロール対応（Intersection Observer使用）

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { ClipCard } from './clip-card';
import type { TwitchClip } from '@/types/twitch';

interface ClipGridProps {
  clips: TwitchClip[];
  isLoading?: boolean;
  likedClipIds?: Set<string>;
  onLikeToggle?: (clipId: string, isCurrentlyLiked: boolean) => void;
  // 無限スクロール用
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

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
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 初回マウント後、アニメーション開始→完了
  useEffect(() => {
    const timer = setTimeout(() => setInitialAnimationDone(true), 350); // アニメーション完了後
    return () => clearTimeout(timer);
  }, []);

  // Intersection Observer で無限スクロール
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoadingMore && onLoadMore) {
        onLoadMore();
      }
    },
    [hasMore, isLoadingMore, onLoadMore]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px', // 100px手前で発火
      threshold: 0,
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [handleObserver]);

  if (isLoading) {
    return (
      <div className="grid-clips">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="aspect-video bg-gray-800 animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (clips.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="text-6xl mb-4">📺</div>
        <p className="text-lg">クリップが見つかりませんでした</p>
      </div>
    );
  }

  return (
    <div>
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
        <div
          ref={loadMoreRef}
          className="flex justify-center py-8"
        >
          {isLoadingMore ? (
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>読み込み中...</span>
            </div>
          ) : (
            <div className="h-8" /> // トリガー用の空要素
          )}
        </div>
      )}
    </div>
  );
}
