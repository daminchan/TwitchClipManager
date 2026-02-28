// 機能: HOTセクション（勢いのあるクリップ、常に1行グリッド）

'use client';

import { useMemo } from 'react';

import { ClipCard } from '@/components/clips/clip-card';
import { useGridColumns } from '@/hooks/use-grid-columns';
import type { TwitchClip } from '@/types/twitch';

interface HotSectionProps {
  clips: TwitchClip[];
  likedClipIds?: Set<string>;
  onLikeToggle?: (clipId: string, isCurrentlyLiked: boolean) => void;
}

export function HotSection({
  clips,
  likedClipIds,
  onLikeToggle,
}: HotSectionProps) {
  const cols = useGridColumns();

  // 列数分だけ表示して常に1行
  const visibleClips = useMemo(
    () => clips.slice(0, cols),
    [clips, cols]
  );

  if (visibleClips.length === 0) return null;

  return (
    <div className="grid-clips">
      {visibleClips.map((clip) => (
        <div key={clip.id} className="clip-card-item">
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
