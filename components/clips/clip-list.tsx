// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション8.2: Props型定義

'use client';

import { useState, useEffect } from 'react';
import { ClipListItem } from './clip-list-item';
import type { TwitchClip } from '@/types/twitch';
import { ANIMATION } from '@/lib/constants';

interface ClipListProps {
  clips: TwitchClip[];
  onDelete: (clipId: string) => void;
  onSelectClip?: (clipId: string) => void;
  deletingClipId?: string;
  currentClipId?: string;
  isLoading?: boolean;
}

export function ClipList({ clips, onDelete, onSelectClip, deletingClipId, currentClipId, isLoading }: ClipListProps) {
  const [showCards, setShowCards] = useState(false);

  // マウント後、アニメーション開始
  useEffect(() => {
    const timer = setTimeout(() => setShowCards(true), ANIMATION.SIDEBAR_CONTENT_DELAY);
    return () => clearTimeout(timer);
  }, []);

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
    <div className="space-y-2">
      {clips.map((clip, index) => (
        <div
          key={clip.id}
          className={showCards ? 'animate-card' : 'opacity-0'}
          style={showCards ? { animationDelay: `${index * ANIMATION.CARD_DELAY_STEP}ms` } : undefined}
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
  );
}
