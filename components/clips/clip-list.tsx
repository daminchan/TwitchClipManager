// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション8.2: Props型定義
// - 無限スクロール対応（Intersection Observer使用）

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { ClipListItem } from './clip-list-item';
import type { TwitchClip } from '@/types/twitch';

interface ClipListProps {
  clips: TwitchClip[];
  onDelete: (clipId: string) => void;
  onSelectClip?: (clipId: string) => void;
  deletingClipId?: string;
  currentClipId?: string;
  isLoading?: boolean;
  // 無限スクロール用
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

export function ClipList({
  clips,
  onDelete,
  onSelectClip,
  deletingClipId,
  currentClipId,
  isLoading,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
}: ClipListProps) {
  // 初回表示アニメーション用（追加読み込み時はアニメーションしない）
  const [initialAnimationDone, setInitialAnimationDone] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 初回マウント後、アニメーション開始→完了
  useEffect(() => {
    const timer = setTimeout(() => setInitialAnimationDone(true), 350);
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
      rootMargin: '100px',
      threshold: 0,
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [handleObserver]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 p-2 animate-pulse">
            <div className="w-[246px] h-[138px] bg-gray-800 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-800 rounded w-3/4" />
              <div className="h-3 bg-gray-800 rounded w-1/2" />
              <div className="h-3 bg-gray-800 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (clips.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="text-6xl mb-4">💜</div>
        <p className="text-lg mb-2">まだお気に入りクリップがありません</p>
        <p className="text-sm">ダッシュボードでクリップにいいねしてみましょう</p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-2">
        {clips.map((clip) => (
          <div
            key={clip.id}
            className={initialAnimationDone ? '' : 'animate-card'}
          >
            <ClipListItem
              clip={clip}
              onDelete={onDelete}
              onSelectClip={onSelectClip}
              isDeleting={deletingClipId === clip.id}
              isSelected={currentClipId === clip.id}
            />
          </div>
        ))}
      </div>

      {/* 無限スクロール: ローディング & トリガー */}
      {hasMore && (
        <div
          ref={loadMoreRef}
          className="flex justify-center py-6"
        >
          {isLoadingMore ? (
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>読み込み中...</span>
            </div>
          ) : (
            <div className="h-6" />
          )}
        </div>
      )}
    </div>
  );
}
