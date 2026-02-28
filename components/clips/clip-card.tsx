// 機能: クリップカード表示（サムネイル、情報、ホバー効果）
// モーダル部分は clip-detail-modal.tsx に分離

'use client';

import { useState } from 'react';
import { Play, Copy } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipDetailModal } from './clip-detail-modal';
import { useModal } from '@/hooks/use-modal';
import { useToast } from '@/hooks/use-toast';
import { Toast } from '@/components/ui/toast';
import { formatDuration } from '@/lib/utils';
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
  const { toast, showToast, hideToast } = useToast();

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(clip.url).then(() => {
      showToast(LABELS.REGISTRATION.LINK_COPIED, 'success');
    });
  };

  return (
    <>
      <Card
        className="h-full flex flex-col overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] bg-[#1a1a1a] border-0 hover:bg-[#222222] hover:shadow-lg hover:shadow-purple-500/10"
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

          {/* コピーボタン（ホバー時表示） */}
          {isHovered && (
            <button
              onClick={handleCopyLink}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors button-press-feedback"
              aria-label="リンクをコピー"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}

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
        <CardContent className="p-4 flex-1">
          <div className="flex gap-3">
            {/* 配信者アバター */}
            <img
              src={clip.profile_image_url || TWITCH_URLS.DEFAULT_AVATAR}
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
                  {clip.view_count.toLocaleString()}再生
                </span>
                <span>•</span>
                <span>{new Date(clip.created_at).toLocaleDateString('ja-JP')}</span>
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

      {/* コピートースト */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </>
  );
}
