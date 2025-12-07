// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション8.2: Props型定義

'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Search, Heart, ThumbsUp, Gamepad2 } from 'lucide-react';
import { StreamerSearch } from '@/components/streamers/streamer-search';
import { FavoriteList } from '@/components/streamers/favorite-list';
import { GameBasedAddModal } from '@/components/sidebar/game-based-add-modal';
import { addMultipleFavoriteStreamers } from '@/actions/favorites';
import { LABELS, ROUTES } from '@/lib/constants';
import type { TwitchChannel, RecommendedStreamer } from '@/types/twitch';

interface DashboardSidebarProps {
  isSidebarOpen: boolean;
  onAddFavorite: (streamer: TwitchChannel) => void;
  onRemoveFavorite?: () => void;
}

export function DashboardSidebar({
  isSidebarOpen,
  onAddFavorite,
  onRemoveFavorite,
}: DashboardSidebarProps) {
  const queryClient = useQueryClient();
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);

  const handleAddStreamersFromGames = async (streamers: RecommendedStreamer[]) => {
    // 一括追加アクションを呼び出し（重複は自動スキップ）
    const result = await addMultipleFavoriteStreamers(
      streamers.map((streamer) => ({
        streamerId: streamer.userId,
        streamerName: streamer.userName,
        streamerLogin: streamer.userLogin,
        streamerImage: streamer.profileImageUrl,
      }))
    );

    // キャッシュ無効化
    await queryClient.invalidateQueries({ queryKey: ['favorites'] });
    await queryClient.invalidateQueries({
      queryKey: ['clips', 'favorites'],
      refetchType: 'active'
    });

    // 結果をスロー（モーダル側でキャッチしてtoast表示）
    if (!result.success) {
      throw new Error(result.message);
    }

    return result;
  };
  return (
    <aside
      className={`
        ${isSidebarOpen ? 'w-80' : 'w-20'}
        hidden lg:block
        bg-[#0f0f0f] border-r border-[#2a2a2a] overflow-y-auto flex-shrink-0 transition-all duration-300
      `}
    >
      <div className="p-4 space-y-4">
        {/* 検索セクション */}
        <div className={`${isSidebarOpen ? 'bg-[#1a1a1a] rounded-lg p-4' : ''}`}>
          <div className="flex items-center gap-2">
            <Search className={`${isSidebarOpen ? 'w-5 h-5' : 'w-6 h-6'} text-gray-400 flex-shrink-0`} />
            {isSidebarOpen && (
              <h2 className="text-sm font-semibold text-gray-100 whitespace-nowrap">
                {LABELS.SECTIONS.SEARCH_STREAMERS}
              </h2>
            )}
          </div>
          {isSidebarOpen && (
            <div className="mt-4">
              <StreamerSearch
                onSelectStreamer={(streamer) => {
                  onAddFavorite(streamer);
                }}
              />
            </div>
          )}
        </div>

        {/* ゲームから追加セクション */}
        <div
          className={`${isSidebarOpen ? 'bg-[#1a1a1a] hover:bg-[#222222] rounded-lg p-4' : ''} cursor-pointer transition-colors`}
          onClick={() => setIsGameModalOpen(true)}
        >
          <div className="flex items-center gap-2">
            <Gamepad2 className={`${isSidebarOpen ? 'w-5 h-5' : 'w-6 h-6'} text-green-500 flex-shrink-0`} />
            {isSidebarOpen && (
              <h2 className="text-sm font-semibold text-gray-100 whitespace-nowrap">
                {LABELS.SECTIONS.GAME_BASED_ADD}
              </h2>
            )}
          </div>
        </div>

        {/* お気に入り配信者セクション */}
        <div className={`${isSidebarOpen ? 'bg-[#1a1a1a] rounded-lg p-4' : ''}`}>
          <div className="flex items-center gap-2">
            <Heart className={`${isSidebarOpen ? 'w-5 h-5' : 'w-6 h-6'} text-purple-500 flex-shrink-0`} />
            {isSidebarOpen && (
              <h2 className="text-sm font-semibold text-gray-100 whitespace-nowrap">
                {LABELS.SECTIONS.FAVORITE_STREAMERS}
              </h2>
            )}
          </div>
          {isSidebarOpen && (
            <div className="mt-4">
              <FavoriteList
                onRemoveFavorite={onRemoveFavorite}
              />
            </div>
          )}
        </div>

        {/* お気に入りクリップセクション */}
        <Link href={ROUTES.FAVORITES_CLIPS}>
          <div className={`${isSidebarOpen ? 'bg-[#1a1a1a] hover:bg-[#222222] rounded-lg p-4' : ''} cursor-pointer transition-colors`}>
            <div className="flex items-center gap-2">
              <ThumbsUp className={`${isSidebarOpen ? 'w-5 h-5' : 'w-6 h-6'} text-pink-500 flex-shrink-0`} />
              {isSidebarOpen && (
                <h2 className="text-sm font-semibold text-gray-100 whitespace-nowrap">
                  {LABELS.SECTIONS.FAVORITE_CLIPS}
                </h2>
              )}
            </div>
          </div>
        </Link>
      </div>

      {/* ゲームベース追加モーダル */}
      <GameBasedAddModal
        isOpen={isGameModalOpen}
        onClose={() => setIsGameModalOpen(false)}
        onAddStreamers={handleAddStreamersFromGames}
      />
    </aside>
  );
}
