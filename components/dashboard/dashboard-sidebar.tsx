// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション8.2: Props型定義

'use client';

import Link from 'next/link';
import { Search, Heart, ThumbsUp } from 'lucide-react';
import { StreamerSearch } from '@/components/streamers/streamer-search';
import { FavoriteList } from '@/components/streamers/favorite-list';
import { LABELS, ROUTES } from '@/lib/constants';
import type { TwitchChannel } from '@/types/twitch';

interface DashboardSidebarProps {
  isSidebarOpen: boolean;
  onAddFavorite: (streamer: TwitchChannel) => void;
  refreshTrigger: number;
}

export function DashboardSidebar({
  isSidebarOpen,
  onAddFavorite,
  refreshTrigger,
}: DashboardSidebarProps) {
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
        <div className="bg-[#1a1a1a] border-0 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Search className={`${isSidebarOpen ? 'w-5 h-5' : 'w-6 h-6'} text-gray-400 flex-shrink-0`} />
            {isSidebarOpen && (
              <h2 className="text-sm font-semibold text-gray-100 whitespace-nowrap">
                {LABELS.SECTIONS.SEARCH_STREAMERS}
              </h2>
            )}
          </div>
          {isSidebarOpen && (
            <StreamerSearch
              onSelectStreamer={(streamer) => {
                onAddFavorite(streamer);
              }}
            />
          )}
        </div>

        {/* お気に入り配信者セクション */}
        <div className="bg-[#1a1a1a] border-0 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Heart className={`${isSidebarOpen ? 'w-5 h-5' : 'w-6 h-6'} text-purple-500 flex-shrink-0`} />
            {isSidebarOpen && (
              <h2 className="text-sm font-semibold text-gray-100 whitespace-nowrap">
                {LABELS.SECTIONS.FAVORITE_STREAMERS}
              </h2>
            )}
          </div>
          {isSidebarOpen && (
            <FavoriteList
              onSelectStreamer={() => {}}
              refreshTrigger={refreshTrigger}
            />
          )}
        </div>

        {/* お気に入りクリップセクション */}
        <Link href={ROUTES.FAVORITES_CLIPS}>
          <div className="bg-[#1a1a1a] hover:bg-[#222222] border-0 rounded-lg p-4 cursor-pointer transition-colors">
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
    </aside>
  );
}
