// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション8.2: Props型定義

'use client';

import { SkipBack, SkipForward, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { TwitchClip } from '@/types/twitch';

interface PlaylistCardProps {
  title: string;
  clipCount: number;
  currentClip: TwitchClip | null;
  currentIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  isLoading?: boolean;
}

export function PlaylistCard({
  title,
  clipCount,
  currentClip,
  currentIndex,
  onNext,
  onPrevious,
  isLoading = false,
}: PlaylistCardProps) {
  return (
    <Card className="bg-[#1a1a1a] border-gray-700 overflow-hidden sticky top-6">
      {/* Twitchプレーヤー / 現在のクリップ */}
      <div className="relative w-full aspect-video bg-gray-800">
        {currentClip ? (
          <div className="relative w-full h-full">
            <iframe
              src={`${currentClip.embed_url}&parent=${window.location.hostname}`}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
            />
            {/* クリップをTwitchで開くボタン */}
            <div className="absolute top-2 right-2 z-10">
              <Button
                onClick={() => window.open(currentClip.url, '_blank')}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Twitchで開く
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <p className="text-sm">クリップを選択してください</p>
          </div>
        )}
      </div>

      {/* 情報 */}
      <div className="p-6">
        {currentClip ? (
          <>
            <h2 className="text-lg font-bold text-gray-100 mb-2 line-clamp-2">{currentClip.title}</h2>
            <div className="text-sm text-gray-400 mb-2">
              <p>{currentClip.broadcaster_name}</p>
              <p>{currentClip.view_count.toLocaleString()}回視聴</p>
            </div>
            <div className="text-xs text-gray-500 mb-4">
              {currentIndex + 1} / {clipCount}
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-100 mb-2">{title}</h2>
            <div className="text-sm text-gray-400 mb-4">
              <p>{clipCount}件のクリップ</p>
            </div>
          </>
        )}

        {/* ナビゲーションボタン */}
        <div className="flex gap-2">
          <Button
            onClick={onPrevious}
            variant="outline"
            className="flex-1 border-gray-600 text-gray-100 hover:bg-gray-800"
            disabled={currentIndex === 0 || isLoading || clipCount === 0}
          >
            <SkipBack className="w-4 h-4 mr-2" />
            前へ
          </Button>
          <Button
            onClick={onNext}
            variant="outline"
            className="flex-1 border-gray-600 text-gray-100 hover:bg-gray-800"
            disabled={currentIndex >= clipCount - 1 || isLoading || clipCount === 0}
          >
            次へ
            <SkipForward className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
