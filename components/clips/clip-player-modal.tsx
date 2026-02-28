'use client';

import { useEffect } from 'react';
import { X, SkipBack, SkipForward, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMounted } from '@/hooks/use-is-mounted';
import { LABELS } from '@/lib/constants';
import type { TwitchClip } from '@/types/twitch';

interface ClipPlayerModalProps {
  clip: TwitchClip | null;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  currentIndex: number;
  totalClips: number;
}

export function ClipPlayerModal({
  clip,
  isOpen,
  onClose,
  onNext,
  onPrevious,
  currentIndex,
  totalClips,
}: ClipPlayerModalProps) {
  const isMounted = useIsMounted();

  const embedParent = isMounted ? window.location.hostname : 'localhost';

  // ESCキーで閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrevious();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // スクロールを無効化
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, onNext, onPrevious]);

  if (!isOpen || !clip) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/95 flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="text-sm text-gray-500">
          {currentIndex + 1} / {totalClips}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-900"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* プレーヤー */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl">
          <div className="relative w-full aspect-video bg-white rounded-lg overflow-hidden">
            <iframe
              src={`${clip.embed_url}&parent=${embedParent}`}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
            />
          </div>
        </div>
      </div>

      {/* 情報 + コントロール */}
      <div className="p-4 border-t border-gray-200">
        {/* クリップ情報 */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 line-clamp-2 mb-1">
            {clip.title}
          </h2>
          <p className="text-sm text-gray-500">
            {clip.broadcaster_name} • {clip.view_count.toLocaleString()}{LABELS.CLIPS.VIEWS_COUNT_SUFFIX}
          </p>
        </div>

        {/* ナビゲーションボタン */}
        <div className="flex gap-2">
          <Button
            onClick={onPrevious}
            variant="outline"
            className="flex-1 border-gray-300 text-gray-900 hover:bg-gray-100"
            disabled={currentIndex === 0}
          >
            <SkipBack className="w-4 h-4 mr-2" />
            {LABELS.BUTTONS.PREVIOUS}
          </Button>
          <Button
            onClick={() => window.open(clip.url, '_blank')}
            variant="outline"
            className="border-purple-600 text-purple-400 hover:bg-purple-600/20"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
          <Button
            onClick={onNext}
            variant="outline"
            className="flex-1 border-gray-300 text-gray-900 hover:bg-gray-100"
            disabled={currentIndex >= totalClips - 1}
          >
            {LABELS.BUTTONS.NEXT}
            <SkipForward className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
