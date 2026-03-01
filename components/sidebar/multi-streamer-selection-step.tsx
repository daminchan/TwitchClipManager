// - RECOMMENDATION_LIMITS定数の使用

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SectionLoadingSpinner } from '@/components/ui/loading-spinner';
import { RECOMMENDATION_LIMITS, CACHE_TIME, LABELS } from '@/lib/constants';
import type { RecommendedStreamer, TwitchGame } from '@/types/twitch';

interface MultiStreamerSelectionStepProps {
  selectedGames: TwitchGame[];
  onNext: (selectedStreamers: RecommendedStreamer[]) => void;
  onBack: () => void;
  isAdding?: boolean;
}

export function MultiStreamerSelectionStep({
  selectedGames,
  onNext,
  onBack,
  isAdding = false,
}: MultiStreamerSelectionStepProps) {
  const [selectedStreamerIds, setSelectedStreamerIds] = useState<Set<string>>(new Set());

  const STREAMER_COUNT = RECOMMENDATION_LIMITS.GAME_BASED_ADD.STREAMER_COUNT;

  // おすすめ配信者を取得（複数ゲーム対応）
  const gameIds = selectedGames.map(g => g.id).join(',');
  const { data: streamersData, isLoading } = useQuery({
    queryKey: ['recommendations', 'streamers', 'multi', gameIds],
    queryFn: async () => {
      const res = await fetch(
        `/api/recommendations/streamers?gameIds=${gameIds}&limit=${STREAMER_COUNT}`
      );
      if (!res.ok) throw new Error('Failed to fetch recommended streamers');
      return res.json();
    },
    staleTime: CACHE_TIME.STREAMERS,
  });

  const streamers: RecommendedStreamer[] = streamersData?.data || [];

  const toggleStreamer = (streamerId: string) => {
    setSelectedStreamerIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(streamerId)) {
        newSet.delete(streamerId);
      } else {
        newSet.add(streamerId);
      }
      return newSet;
    });
  };

  const handleNext = () => {
    const selected = streamers.filter((s) => selectedStreamerIds.has(s.userId));
    onNext(selected);
  };

  // ゲーム名をカンマ区切りで表示
  const gameNames = selectedGames.map(g => g.name).join('、');

  // 追加中はローディングオーバーレイを表示
  if (isAdding) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="relative mb-6">
          {/* 回転するリング */}
          <div className="w-20 h-20 border-4 border-[#e6e0d6] rounded-full" />
          <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-[#8a8078] rounded-full animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-[#44403c] mb-2">
          お気に入りに追加中...
        </h2>
        <p className="text-sm text-[#a09890] text-center">
          {selectedStreamerIds.size}人の配信者を追加しています
        </p>
        <p className="text-xs text-[#b8b0a6] mt-4">
          しばらくお待ちください
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#44403c] mb-2">
          おすすめ配信者
        </h2>
        <p className="text-sm text-[#a09890]">
          {gameNames} のおすすめ配信者です。お気に入りに追加する配信者を選択してください
        </p>
      </div>

      {/* 配信者一覧 */}
      <div className="flex-1 overflow-y-auto mb-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <SectionLoadingSpinner text={LABELS.MESSAGES.LOADING_STREAMERS} />
          </div>
        ) : streamers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-[#6b655c] mb-2">おすすめ配信者が見つかりませんでした</p>
            <p className="text-sm text-[#a09890]">別のゲームを試してみてください</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {streamers.map((streamer) => {
              const isSelected = selectedStreamerIds.has(streamer.userId);

              return (
                <button
                  key={streamer.userId}
                  onClick={() => toggleStreamer(streamer.userId)}
                  className={`group relative flex flex-col items-center p-4 rounded-lg transition-all duration-300 ${
                    isSelected
                      ? 'bg-[#ebe5dc] ring-2 ring-[#8a8078] scale-105 shadow-lg shadow-[#c4bdb2]/30'
                      : 'bg-[#faf8f5] hover:bg-[#ebe5dc] hover:ring-1 hover:ring-[#c4bdb2] hover:scale-105 hover:shadow-md'
                  }`}
                >
                  {/* プロフィール画像 */}
                  <div className="relative w-20 h-20 mb-3">
                    {streamer.profileImageUrl ? (
                      <Image
                        src={streamer.profileImageUrl}
                        alt={streamer.userName}
                        fill
                        className="rounded-full object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-[#e6e0d6] flex items-center justify-center">
                        <span className="text-2xl text-[#6b655c]">
                          {streamer.userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {/* チェックマーク */}
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#8a8078] rounded-full flex items-center justify-center ring-2 ring-[#faf8f5] animate-in zoom-in-0 duration-200">
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  {/* 配信者名 */}
                  <p className="text-sm font-semibold text-[#44403c] mb-1 text-center line-clamp-1 w-full">
                    {streamer.userName}
                  </p>

                  {/* 統計情報 */}
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-xs text-[#a09890] text-center">
                      再生数:{' '}
                      <span className="text-[#6b655c] font-semibold">
                        {streamer.totalClipViews.toLocaleString()}
                      </span>
                    </p>
                    <p className="text-xs text-[#a09890]">
                      {streamer.clipCount} クリップ
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* フッターボタン（モバイルフッターに隠れないようにpb追加） */}
      <div className="flex gap-3 pb-20 lg:pb-0">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isAdding}
          className="flex-1 btn-secondary disabled:opacity-50"
        >
          戻る
        </Button>
        <Button
          onClick={handleNext}
          disabled={selectedStreamerIds.size === 0 || isLoading || isAdding}
          className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAdding ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin"><Loader2 className="w-4 h-4" /></div>
              追加中...
            </span>
          ) : (
            `お気に入りに追加 (${selectedStreamerIds.size}人選択)`
          )}
        </Button>
      </div>
    </div>
  );
}
