// 機能: クリップのグリッド表示（無限スクロール対応）

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

import { ClipCard } from './clip-card';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { staggerContainer, fadeInUp } from '@/lib/animations';
import { LABELS, ANIMATION } from '@/lib/constants';
import type { TwitchClip } from '@/types/twitch';

interface ClipGridProps {
  clips: TwitchClip[];
  isLoading?: boolean;
  likedClipIds?: Set<string>;
  onLikeToggle?: (clipId: string, isCurrentlyLiked: boolean) => void;
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
  const [initialAnimationDone, setInitialAnimationDone] = useState(false);

  const { loadMoreRef } = useInfiniteScroll({
    hasMore,
    onLoadMore: onLoadMore ?? (() => {}),
  });

  useEffect(() => {
    const timer = setTimeout(
      () => setInitialAnimationDone(true),
      ANIMATION.GRID_INITIAL_DELAY
    );
    return () => clearTimeout(timer);
  }, []);

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
      <motion.div
        className="grid-clips"
        variants={staggerContainer}
        initial={initialAnimationDone ? false : 'hidden'}
        animate="visible"
      >
        {clips.map((clip) => (
          <motion.div key={clip.id} variants={fadeInUp} className="clip-card-item">
            <ClipCard
              clip={clip}
              isLiked={likedClipIds?.has(clip.id)}
              onLikeToggle={onLikeToggle}
            />
          </motion.div>
        ))}
      </motion.div>

      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          {isLoadingMore ? (
            <div className="flex items-center gap-2 text-gray-400">
              {/* SVGラッパーでアニメーション（ルール6.1: GPU加速） */}
              <div className="animate-spin">
                <Loader2 className="w-5 h-5" />
              </div>
              <span>{LABELS.BUTTONS.LOADING}</span>
            </div>
          ) : (
            <div className="h-8" />
          )}
        </div>
      )}
    </div>
  );
}
