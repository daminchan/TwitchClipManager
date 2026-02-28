// 機能: クリップカード表示（サムネイル、情報、ホバー効果）
// モーダル部分は clip-detail-modal.tsx に分離

'use client';

import { useState, useMemo } from 'react';
import { Play } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipDetailModal } from './clip-detail-modal';
import { useModal } from '@/hooks/use-modal';
import { useIsMounted } from '@/hooks/use-is-mounted';
import { formatViewCount, formatRelativeTime, formatDuration } from '@/lib/utils';
import { LABELS, TWITCH_URLS } from '@/lib/constants';
import type { TwitchClip } from '@/types/twitch';

interface ClipCardProps {
  clip: TwitchClip;
  isLiked?: boolean;
  onLikeToggle?: (clipId: string, isCurrentlyLiked: boolean) => void;
}

/**
 * クリップカードコンポーネント
 * クリップのサムネイル、タイトル、配信者情報を表示
 * クリックでモーダルを開いて動画を再生
 */
export function ClipCard({ clip, isLiked = false, onLikeToggle }: ClipCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { isOpen: isModalOpen, openModal, closeModal } = useModal();
  const isMounted = useIsMounted();

  // 相対時間の計算（クライアントサイドでのみ - Hydrationエラー防止）
  const relativeTime = useMemo(() => {
    if (!isMounted) return formatRelativeTime(clip.created_at);
    return formatRelativeTime(clip.created_at, new Date());
  }, [isMounted, clip.created_at]);

  return (
    <>
      <Card
        className="overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] bg-[#1a1a1a] border-0 hover:bg-[#222222] hover:shadow-lg hover:shadow-purple-500/10"
        onMouseEnter={() => !isModalOpen && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={openModal}
      >
        {/* サムネイル部分 */}
        <div className="relative aspect-video bg-black">
          <img
            src={clip.thumbnail_url}
            alt={clip.title}
            className="w-full h-full object-cover"
          />

          {/* 動画時間バッジ */}
          <Badge className="absolute bottom-2 right-2 bg-black/90 text-white border-0 font-semibold px-2 py-0.5">
            {formatDuration(clip.duration)}
          </Badge>

          {/* ホバー時の再生オーバーレイ */}
          {isHovered && (
            <div
              className="absolute inset-0 bg-black/40 flex items-center justify-center"
              aria-hidden="true"
            >
              <div className="bg-purple-600 rounded-full p-3" role="presentation">
                <Play
                  className="w-6 h-6 text-white fill-white"
                  aria-label={LABELS.CLIPS.PLAY_CLIP}
                />
              </div>
            </div>
          )}
        </div>

        {/* クリップ情報部分 */}
        <CardContent className="p-4">
          <div className="flex gap-3">
            {/* 配信者アバター */}
            <img
              src={TWITCH_URLS.PROFILE_IMAGE(clip.broadcaster_name)}
              alt={clip.broadcaster_name}
              className="w-10 h-10 rounded-full flex-shrink-0 mt-0.5"
              onError={(e) => {
                e.currentTarget.src = TWITCH_URLS.DEFAULT_AVATAR;
              }}
            />

            {/* テキスト情報 */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold line-clamp-2 text-base text-gray-100 mb-2 leading-snug">
                {clip.title}
              </h3>
              <div className="text-sm text-gray-300 mb-1 font-medium">
                {clip.broadcaster_name}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>
                  {formatViewCount(clip.view_count)} {LABELS.CLIPS.VIEWS_SUFFIX}
                </span>
                <span>•</span>
                <span>{relativeTime}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 詳細モーダル（分離コンポーネント） */}
      <ClipDetailModal
        clip={clip}
        isOpen={isModalOpen}
        onClose={closeModal}
        isLiked={isLiked}
        onLikeToggle={onLikeToggle}
      />
    </>
  );
}
