// - RECOMMENDATION_LIMITS定数の使用

'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RECOMMENDATION_LIMITS, CACHE_TIME } from '@/lib/constants';
import type { TwitchGame } from '@/types/twitch';

interface MultiGameSelectionStepProps {
  onNext: (games: TwitchGame[]) => void;
  onCancel: () => void;
}

export function MultiGameSelectionStep({ onNext, onCancel }: MultiGameSelectionStepProps) {
  const [selectedGames, setSelectedGames] = useState<TwitchGame[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const MAX_GAMES = RECOMMENDATION_LIMITS.GAME_BASED_ADD.MAX_GAMES;

  // 検索クエリのデバウンス（300ms）
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 人気ゲーム一覧を取得
  const { data: topGamesData, isLoading: isLoadingTop } = useQuery({
    queryKey: ['games', 'top'],
    queryFn: async () => {
      const res = await fetch('/api/games/top');
      if (!res.ok) throw new Error('Failed to fetch games');
      return res.json();
    },
    staleTime: CACHE_TIME.GAMES,
  });

  // ゲーム検索（デバウンス後のクエリがある場合のみ）
  const { data: searchGamesData, isLoading: isLoadingSearch } = useQuery({
    queryKey: ['games', 'search', debouncedQuery],
    queryFn: async () => {
      const res = await fetch(`/api/games/search?q=${encodeURIComponent(debouncedQuery)}`);
      if (!res.ok) throw new Error('Failed to search games');
      return res.json();
    },
    enabled: debouncedQuery.length >= 2, // 2文字以上で検索
    staleTime: CACHE_TIME.GAMES,
  });

  const topGames: TwitchGame[] = topGamesData?.data || [];
  const searchResults: TwitchGame[] = searchGamesData?.data || [];

  // 表示するゲーム一覧を決定
  const displayGames = useMemo(() => {
    if (debouncedQuery.length >= 2) {
      // 検索モード: API検索結果を表示
      return searchResults;
    } else {
      // 通常モード: 人気ゲームをローカルフィルタリング
      if (searchQuery.length > 0) {
        return topGames.filter((game) =>
          game.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return topGames;
    }
  }, [debouncedQuery, searchQuery, topGames, searchResults]);

  const isLoading = isLoadingTop || (debouncedQuery.length >= 2 && isLoadingSearch);
  const isSearching = searchQuery.length >= 2 && searchQuery !== debouncedQuery;

  const toggleGame = (game: TwitchGame) => {
    setSelectedGames((prev) => {
      const isSelected = prev.some((g) => g.id === game.id);
      if (isSelected) {
        // 選択解除
        return prev.filter((g) => g.id !== game.id);
      } else {
        // 選択（最大3個まで）
        if (prev.length >= MAX_GAMES) {
          return prev; // 最大数に達している場合は無視
        }
        return [...prev, game];
      }
    });
  };

  const handleNext = () => {
    if (selectedGames.length > 0) {
      onNext(selectedGames);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          好きなゲームを選択してください
        </h2>
        <p className="text-sm text-gray-500">
          最大{MAX_GAMES}つまで選択できます。選択したゲームのおすすめ配信者を表示します
        </p>
      </div>

      {/* 検索バーと選択数バッジ */}
      <div className="mb-4 flex gap-3 items-center">
        <div className="relative flex-1">
          {isSearching ? (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 animate-spin">
              <Loader2 className="w-5 h-5 text-purple-400" />
            </div>
          ) : (
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          )}
          <Input
            type="text"
            placeholder="ゲームを検索...（例: ストリートファイター）"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-0 text-gray-900 placeholder-gray-500"
          />
        </div>
        {selectedGames.length > 0 && (
          <Badge variant="secondary" className="bg-purple-600/20 text-purple-300 border-purple-500/30">
            {selectedGames.length} / {MAX_GAMES} 選択中
          </Badge>
        )}
      </div>

      {/* 検索モード表示 */}
      {debouncedQuery.length >= 2 && (
        <div className="mb-4 text-sm text-gray-500">
          「{debouncedQuery}」の検索結果: {displayGames.length}件
        </div>
      )}

      {/* ゲーム一覧 */}
      <div className="flex-1 overflow-y-auto mb-6">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] bg-white rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : displayGames.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchQuery.length >= 2 ? '該当するゲームが見つかりませんでした' : 'ゲームが見つかりませんでした'}
            </p>
            {searchQuery.length >= 2 && (
              <p className="text-sm text-gray-500 mt-2">
                別のキーワードで検索してみてください
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayGames.map((game) => {
              const isSelected = selectedGames.some((g) => g.id === game.id);
              const isMaxReached = selectedGames.length >= MAX_GAMES && !isSelected;
              // 検索APIは固定サイズURLを返すため、game.idから正しいURLを構築
              const boxArtUrl = game.box_art_url.includes('{width}')
                ? game.box_art_url.replace('{width}', '480').replace('{height}', '640')
                : `https://static-cdn.jtvnw.net/ttv-boxart/${game.id}-480x640.jpg`;

              return (
                <button
                  key={game.id}
                  onClick={() => toggleGame(game)}
                  disabled={isMaxReached}
                  className={`group relative aspect-[3/4] rounded-lg overflow-hidden transition-all duration-300 ${
                    isSelected
                      ? 'ring-4 ring-purple-600 scale-105 shadow-xl shadow-purple-500/50'
                      : isMaxReached
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:ring-2 hover:ring-gray-300 hover:scale-105 hover:shadow-lg'
                  }`}
                >
                  <Image
                    src={boxArtUrl}
                    alt={game.name}
                    fill
                    className="object-cover"
                    sizes="240px"
                    quality={90}
                    unoptimized
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
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1 bg-white border-gray-200 text-gray-900 hover:bg-gray-200"
        >
          キャンセル
        </Button>
        <Button
          onClick={handleNext}
          disabled={selectedGames.length === 0}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          次へ ({selectedGames.length}個選択)
        </Button>
      </div>
    </div>
  );
}
