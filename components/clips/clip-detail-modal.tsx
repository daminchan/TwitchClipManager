'use client';

import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, ExternalLink, Copy } from 'lucide-react';
import { modalOverlay, modalContent } from '@/lib/animations';

import { Button } from '@/components/ui/button';
import { useIsMounted } from '@/hooks/use-is-mounted';
import { formatViewCount, formatRelativeTime } from '@/lib/utils';
import { LABELS, ANIMATION } from '@/lib/constants';
import type { TwitchClip } from '@/types/twitch';

interface FloatingHeart {
  id: number;
  x: number;
  y: number;
}

interface ClipDetailModalProps {
  clip: TwitchClip;
  isOpen: boolean;
  onClose: () => void;
  isLiked?: boolean;
  onLikeToggle?: (clipId: string, isCurrentlyLiked: boolean) => void;
}

export function ClipDetailModal({
  clip,
  isOpen,
  onClose,
  isLiked = false,
  onLikeToggle,
}: ClipDetailModalProps) {
  const isMounted = useIsMounted();
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [heartIdCounter, setHeartIdCounter] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  // embedのparentはクライアントサイドでのみ取得
  const embedParent = useMemo(() => {
    if (!isMounted) return 'localhost';
    return window.location.hostname;
  }, [isMounted]);

  // 相対時間の計算（クライアントサイドでのみ - Hydrationエラー防止）
  const relativeTime = useMemo(() => {
    if (!isMounted) return formatRelativeTime(clip.created_at);
    return formatRelativeTime(clip.created_at, new Date());
  }, [isMounted, clip.created_at]);

  // いいねボタンのクリックハンドラー
  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onLikeToggle) return;

    // いいねの場合のみアニメーション表示
    if (!isLiked) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newHeart: FloatingHeart = {
        id: heartIdCounter,
        x: x + (Math.random() - 0.5) * ANIMATION.LIKE_HEART_OFFSET,
        y: y,
      };

      setFloatingHearts(prev => [...prev, newHeart]);
      setHeartIdCounter(prev => prev + 1);

      // アニメーション終了後に削除
      setTimeout(() => {
        setFloatingHearts(prev => prev.filter(h => h.id !== newHeart.id));
      }, ANIMATION.LIKE_HEART_DURATION);
    }

    onLikeToggle(clip.id, isLiked);
  };

  // シェアボタンのクリックハンドラー
  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(clip.url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // フォールバック不要 - クリップボードAPIが使えない環境は無視
    }
  };

  if (!isMounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          onClick={onClose}
          variants={modalOverlay}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div
            className="relative w-full max-w-5xl bg-gray-900 rounded-lg overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
          aria-label={LABELS.BUTTONS.CLOSE}
        >
          <X className="w-6 h-6" />
        </button>

        {/* Twitch Embed iframe */}
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={`${clip.embed_url}&parent=${embedParent}&autoplay=true`}
            className="absolute top-0 left-0 w-full h-full"
            allowFullScreen
            title={clip.title}
          />
        </div>

        {/* クリップ情報 */}
        <div className="p-6 bg-gray-800">
          <div className="flex items-start gap-3 mb-2">
            <h2 className="text-xl font-semibold text-gray-100 flex-1">
              {clip.title}
            </h2>

            {/* いいねボタン */}
            {onLikeToggle && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLikeClick}
                  className={`flex items-center gap-2 transition-all ${
                    isLiked
                      ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50'
                      : 'bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600'
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 transition-transform ${
                      isLiked ? 'fill-current scale-110' : ''
                    }`}
                  />
                  <span className="text-sm font-medium">
                    {isLiked ? LABELS.BUTTONS.LIKED : LABELS.BUTTONS.LIKE}
                  </span>
                </Button>

                {/* 浮遊するハートのアニメーション */}
                {floatingHearts.map((heart) => (
                  <div
                    key={heart.id}
                    className="absolute pointer-events-none animate-float-heart"
                    style={{
                      left: `${heart.x}px`,
                      top: `${heart.y}px`,
                    }}
                  >
                    <span className="text-2xl">💛</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span className="font-medium text-purple-400">
              {clip.broadcaster_name}
            </span>
            <span>•</span>
            <span>
              {formatViewCount(clip.view_count)} {LABELS.CLIPS.VIEWS_SUFFIX}
            </span>
            <span>•</span>
            <span>{relativeTime}</span>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <a
              href={clip.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              {LABELS.CLIPS.VIEW_ON_TWITCH}
            </a>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors button-press-feedback"
            >
              <Copy className="w-4 h-4" />
              {isCopied ? LABELS.REGISTRATION.LINK_COPIED : 'リンクをコピー'}
            </button>
          </div>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
