// 機能: 週間ランキング（ヘッダー内ページ切り替え、常に1行グリッド）

'use client';

import { useState } from 'react';
import { Crown, Trophy, ChevronRight, ChevronLeft } from 'lucide-react';

import { ClipCard } from '@/components/clips/clip-card';
import { useGridColumns } from '@/hooks/use-grid-columns';
import { LABELS } from '@/lib/constants';
import type { TwitchClip } from '@/types/twitch';

interface RankingSectionProps {
  clips: TwitchClip[];
  likedClipIds?: Set<string>;
  onLikeToggle?: (clipId: string, isCurrentlyLiked: boolean) => void;
}

function RankLabel({ rank }: { rank: number }) {
  const colorClass =
    rank === 1 ? 'text-yellow-400' :
    rank === 2 ? 'text-gray-300' :
    rank === 3 ? 'text-amber-600' :
    'text-gray-400';

  return (
    <div className={`flex items-center gap-1 mb-2 ${colorClass}`}>
      {rank === 1 && <Crown className="w-5 h-5" />}
      <span className="text-lg font-bold">
        {rank}{LABELS.SECTIONS.RANKING_SUFFIX}
      </span>
    </div>
  );
}

export function RankingSection({
  clips,
  likedClipIds,
  onLikeToggle,
}: RankingSectionProps) {
  const [page, setPage] = useState(0);
  const cols = useGridColumns();

  if (clips.length === 0) return null;

  const perPage = cols;
  const totalPages = Math.ceil(clips.length / perPage);
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * perPage;
  const visibleClips = clips.slice(start, start + perPage);
  const hasNextPage = safePage < totalPages - 1;
  const hasPrevPage = safePage > 0;

  // ボタン生成（前へ・次へを両方表示）
  const prevButton = hasPrevPage ? (
    <button
      onClick={() => setPage(safePage - 1)}
      className="btn-gradient-pill"
    >
      <span>
        <ChevronLeft className="w-4 h-4" />
        {(safePage - 1) * perPage + 1}〜{safePage * perPage}{LABELS.SECTIONS.RANKING_SUFFIX}
      </span>
    </button>
  ) : null;

  const nextButton = hasNextPage ? (
    <button
      onClick={() => setPage(safePage + 1)}
      className="btn-gradient-pill"
    >
      <span>
        {(safePage + 1) * perPage + 1}〜{Math.min((safePage + 2) * perPage, clips.length)}{LABELS.SECTIONS.RANKING_SUFFIX}
        <ChevronRight className="w-4 h-4" />
      </span>
    </button>
  ) : null;

  const hasButtons = prevButton || nextButton;

  return (
    <div>
      {/* ヘッダー + ページ切り替えボタン */}
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-purple-400" />
        <h2 className="text-lg font-bold text-gray-100">
          {LABELS.SECTIONS.WEEKLY_RANKING}
        </h2>
        {hasButtons && (
          <div className="ml-auto flex items-center gap-2">
            {prevButton}
            {nextButton}
          </div>
        )}
      </div>

      {/* カードグリッド（常に1行） */}
      <div className="grid-clips">
        {visibleClips.map((clip, index) => {
          const rank = start + index + 1;
          return (
            <div key={clip.id} className="clip-card-item">
              <RankLabel rank={rank} />
              <ClipCard
                clip={clip}
                isLiked={likedClipIds?.has(clip.id)}
                onLikeToggle={onLikeToggle}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
