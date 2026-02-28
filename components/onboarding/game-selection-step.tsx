// - オンボーディングフロー設計.md: ゲーム選択機能

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CACHE_TIME } from '@/lib/constants';
import type { TwitchGame } from '@/types/twitch';

interface GameSelectionStepProps {
  onNext: (gameId: string, gameName: string) => void;
  onBack?: () => void;
}

export function GameSelectionStep({ onNext, onBack }: GameSelectionStepProps) {
  const [selectedGame, setSelectedGame] = useState<TwitchGame | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 人気ゲーム一覧を取得
  const { data: gamesData, isLoading } = useQuery({
    queryKey: ['games', 'top'],
    queryFn: async () => {
      const res = await fetch('/api/games/top');
      if (!res.ok) throw new Error('Failed to fetch games');
      return res.json();
    },
    staleTime: CACHE_TIME.GAMES,
  });

  const games: TwitchGame[] = gamesData?.data || [];

  // 検索フィルター
  const filteredGames = games.filter((game) =>
    game.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNext = () => {
    if (selectedGame) {
      onNext(selectedGame.id, selectedGame.name);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-100 mb-2">
          好きなゲームを選択してください
        </h2>
        <p className="text-sm text-gray-400">
          選択したゲームのおすすめ配信者を表示します
        </p>
      </div>

      {/* 検索バー */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="ゲームを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#1a1a1a] border-0 text-gray-100 placeholder-gray-400"
          />
        </div>
      </div>

      {/* ゲーム一覧 */}
      <div className="flex-1 overflow-y-auto mb-6">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] bg-[#1a1a1a] rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredGames.map((game) => {
              const isSelected = selectedGame?.id === game.id;
              const boxArtUrl = game.box_art_url
                .replace('{width}', '285')
                .replace('{height}', '380');

              return (
                <button
                  key={game.id}
                  onClick={() => setSelectedGame(game)}
                  className={`group relative aspect-[3/4] rounded-lg overflow-hidden transition-all duration-300 ${
                    isSelected
                      ? 'ring-4 ring-purple-600 scale-105 shadow-xl shadow-purple-500/50'
                      : 'hover:ring-2 hover:ring-gray-600 hover:scale-105 hover:shadow-lg'
                  }`}
                >
                  <Image
                    src={boxArtUrl}
                    alt={game.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  <div
                    className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity ${
                      isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-sm font-semibold text-white line-clamp-2">
                        {game.name}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center animate-in zoom-in-0 duration-200">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* フッターボタン（モバイルフッターに隠れないようにpb追加） */}
      <div className="flex gap-3 pb-20 lg:pb-0">
        {onBack && (
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1 bg-[#1a1a1a] border-gray-700 text-gray-100 hover:bg-[#2a2a2a]"
          >
            戻る
          </Button>
        )}
        <Button
          onClick={handleNext}
          disabled={!selectedGame}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          次へ
        </Button>
      </div>
    </div>
  );
}
