// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション8.2: Props型定義
// - セクション5.3: レスポンシブデザイン（モバイルファースト）

'use client';

import { ClipCard } from './clip-card';
import type { TwitchClip } from '@/types/twitch';

interface ClipGridProps {
  clips: TwitchClip[];
  isLoading?: boolean;
  likedClipIds?: Set<string>;
  onLikeToggle?: (clipId: string, isCurrentlyLiked: boolean) => void;
}

export function ClipGrid({ clips, isLoading, likedClipIds, onLikeToggle }: ClipGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {clips.map((clip) => (
        <ClipCard
          key={clip.id}
          clip={clip}
          isLiked={likedClipIds?.has(clip.id)}
          onLikeToggle={onLikeToggle}
        />
      ))}
    </div>
  );
}
