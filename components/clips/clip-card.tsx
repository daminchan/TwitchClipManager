// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション8.2: Props型定義
// - セクション10.1: 画像最適化（Next.js Image使用は今回はサムネイルURLをそのまま使用）
// - セクション17: 定数管理（ANIMATION定数使用）

'use client';

import { useState, useEffect, useMemo } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

import { formatViewCount, formatRelativeTime, formatDuration } from '@/lib/utils';
import { ANIMATION } from '@/lib/constants';
import type { TwitchClip } from '@/types/twitch';

// 浮遊するハートのアニメーション型定義
interface FloatingHeart {
  id: number;
  x: number;
  y: number;
}

interface ClipCardProps {
  clip: TwitchClip;
  isLiked?: boolean;
  onLikeToggle?: (clipId: string, isCurrentlyLiked: boolean) => void;
}

export function ClipCard({ clip, isLiked = false, onLikeToggle }: ClipCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [heartIdCounter, setHeartIdCounter] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // クライアントサイドでのみマウント状態を更新（Hydrationエラー防止）
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // embedのparentはクライアントサイドでのみ取得
  const embedParent = useMemo(() => {
    if (!isMounted) return 'localhost';
    return window.location.hostname;
  }, [isMounted]);

  // 相対時間の計算（クライアントサイドでのみ - Hydrationエラー防止）
  const relativeTime = useMemo(() => {
    if (!isMounted) return formatRelativeTime(clip.created_at); // SSR: 日付フォーマット
    return formatRelativeTime(clip.created_at, new Date()); // クライアント: 相対時間
  }, [isMounted, clip.created_at]);

  const handleClick = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // カードクリックイベントを防ぐ

    if (!onLikeToggle) return;

    // いいねの場合のみアニメーション表示
    if (!isLiked) {
      // ボタンの位置を取得
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // 新しいハートを追加
      const newHeart: FloatingHeart = {
        id: heartIdCounter,
        x: x + (Math.random() - 0.5) * ANIMATION.LIKE_HEART_OFFSET,
        y: y,
      };

      setFloatingHearts((prev) => [...prev, newHeart]);
      setHeartIdCounter((prev) => prev + 1);

      // アニメーション終了後に削除
      setTimeout(() => {
        setFloatingHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
      }, ANIMATION.LIKE_HEART_DURATION);
    }

    // 連打可能 - YouTubeのように即座にUIが変わる
    onLikeToggle(clip.id, isLiked);
  };

  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  return (
    <>
    <Card
      className="overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] bg-[#1a1a1a] border-0 hover:bg-[#222222] hover:shadow-lg hover:shadow-purple-500/10"
      onMouseEnter={() => !isModalOpen && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className="relative aspect-video bg-black">
        <img
          src={clip.thumbnail_url}
          alt={clip.title}
          className="w-full h-full object-cover"
        />

        <Badge className="absolute bottom-2 right-2 bg-black/90 text-white border-0 font-semibold px-2 py-0.5">
          {formatDuration(clip.duration)}
        </Badge>
        {isHovered && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-purple-600 rounded-full p-3">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <img
            src={`https://static-cdn.jtvnw.net/jtv_user_pictures/${clip.broadcaster_name}-profile_image-70x70.png`}
            alt={clip.broadcaster_name}
            className="w-10 h-10 rounded-full flex-shrink-0 mt-0.5"
            onError={(e) => {
              e.currentTarget.src = 'https://static-cdn.jtvnw.net/user-default-pictures-uv/cdd517fe-def4-11e9-948e-784f43822e80-profile_image-70x70.png';
            }}
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold line-clamp-2 text-base text-gray-100 mb-2 leading-snug">{clip.title}</h3>
            <div className="text-sm text-gray-300 mb-1 font-medium">{clip.broadcaster_name}</div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{formatViewCount(clip.view_count)} views</span>
              <span>•</span>
              <span>{relativeTime}</span>
            </div>
          </div>
        </div>
      </CardContent>

      </Card>

      {/* モーダル: サイト内でクリップを再生 */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-5xl bg-gray-900 rounded-lg overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 閉じるボタン */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
              aria-label="閉じる"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
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
                <h2 className="text-xl font-semibold text-gray-100 flex-1">{clip.title}</h2>
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
                      <Heart className={`w-5 h-5 transition-transform ${isLiked ? 'fill-current scale-110' : ''}`} />
                      <span className="text-sm font-medium">{isLiked ? 'いいね済み' : 'いいね'}</span>
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
                <span className="font-medium text-purple-400">{clip.broadcaster_name}</span>
                <span>•</span>
                <span>{formatViewCount(clip.view_count)} views</span>
                <span>•</span>
                <span>{relativeTime}</span>
              </div>
              <div className="mt-4">
                <a
                  href={clip.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                  </svg>
                  Twitchで見る
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
