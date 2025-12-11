// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション8.2: Props型定義
// - セクション5.3: レスポンシブデザイン（モバイルファースト）

'use client';

import { useState, useEffect } from 'react';
import { ClipCard } from './clip-card';
import type { TwitchClip } from '@/types/twitch';

interface ClipGridProps {
  clips: TwitchClip[];
  isLoading?: boolean;
  likedClipIds?: Set<string>;
  onLikeToggle?: (clipId: string, isCurrentlyLiked: boolean) => void;
}

export function ClipGrid({ clips, isLoading, likedClipIds, onLikeToggle }: ClipGridProps) {
  const [showCards, setShowCards] = useState(false);

  // マウント後、カード表示アニメーション開始
  useEffect(() => {
    const timer = setTimeout(() => setShowCards(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // クリップが更新されたらアニメーションをリセット
  useEffect(() => {
    setShowCards(false);
    const timer = setTimeout(() => setShowCards(true), 50);
    return () => clearTimeout(timer);
  }, [clips]);

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
    <div className="grid-clips">
      {clips.map((clip) => (
        <div
          key={clip.id}
          className={showCards ? 'animate-card' : 'opacity-0'}
        >
          <ClipCard
            clip={clip}
            isLiked={likedClipIds?.has(clip.id)}
            onLikeToggle={onLikeToggle}
          />
        </div>
      ))}
    </div>
  );
}
