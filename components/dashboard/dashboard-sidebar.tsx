// - CSS共通クラス使用（sidebar-btn, sidebar-section）

'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, Heart, ThumbsUp, Gamepad2, Radio, ChevronRight, Play } from 'lucide-react';
import { StreamerSearchModal } from '@/components/streamers/streamer-search-modal';
import { LiveStreamerList } from '@/components/streamers/live-streamer-list';
import { GameBasedAddModal } from '@/components/sidebar/game-based-add-modal';
import { RegistrationPromptModal } from '@/components/auth/registration-prompt-modal';
import { addMultipleFavoriteStreamers } from '@/actions/favorites';
import { LABELS, ROUTES } from '@/lib/constants';
import type { TwitchChannel, RecommendedStreamer } from '@/types/twitch';

interface DashboardSidebarProps {
  isSidebarOpen: boolean;
  isAuthenticated?: boolean;
  onAddFavorite?: (streamer: TwitchChannel) => void;
  onRemoveFavorite?: () => void;
  favoriteStreamerIds?: string[];
}

export function DashboardSidebar({
  isSidebarOpen,
  isAuthenticated = true,
  onAddFavorite,
  onRemoveFavorite,
  favoriteStreamerIds = [],
}: DashboardSidebarProps) {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [showRegistrationPrompt, setShowRegistrationPrompt] = useState(false);

  const isClipListActive = pathname === ROUTES.HOME;

  const handleAddStreamersFromGames = async (streamers: RecommendedStreamer[]) => {
    // サーバーアクション実行（追加完了を待つ）
    const result = await addMultipleFavoriteStreamers(
      streamers.map((streamer) => ({
        streamerId: streamer.userId,
        streamerName: streamer.userName,
        streamerLogin: streamer.userLogin,
        streamerImage: streamer.profileImageUrl,
      }))
    );

    if (!result.success) {
      throw new Error(result.message);
    }

    // 追加完了後にデータを再取得
    await queryClient.invalidateQueries({ queryKey: ['favorites'] });
    await queryClient.invalidateQueries({
      queryKey: ['clips', 'favorites'],
      refetchType: 'active'
    });

    return result;
  };

  return (
    <aside
      className={`
        ${isSidebarOpen ? 'w-80' : 'w-20'}
        hidden lg:block h-full
        bg-[#0f0f0f] border-r border-[#2a2a2a] overflow-y-auto overflow-x-hidden flex-shrink-0 transition-[width] duration-300 ease-in-out
      `}
    >
      <div className={`p-4 space-y-4 ${isSidebarOpen ? 'min-w-[288px]' : 'min-w-[48px]'}`}>
        {/* クリップ一覧ボタン */}
        <div className={isSidebarOpen ? 'sidebar-section' : ''}>
          <Link href={ROUTES.HOME} className="block">
            <div className={`
              ${isSidebarOpen ? 'sidebar-btn' : 'sidebar-btn-collapsed'}
              ${isClipListActive
                ? isSidebarOpen
                  ? 'bg-gradient-to-r from-blue-600/30 to-cyan-600/30 border border-blue-500/50'
                  : 'bg-blue-600/30'
                : isSidebarOpen
                  ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20 hover:from-blue-600/30 hover:to-cyan-600/30 border border-blue-500/30 hover:border-blue-500/50'
                  : 'bg-blue-600/20 hover:bg-blue-600/30'
              }
              focus:ring-blue-500 group cursor-pointer
            `}>
              <div className={`flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}>
                <Play className="w-5 h-5 text-blue-400 flex-shrink-0" />
                {isSidebarOpen && (
                  <>
                    <span className="text-sm font-medium text-blue-100 flex-1">
                      {LABELS.SECTIONS.CLIP_LIST}
                    </span>
                    <ChevronRight className="w-4 h-4 text-blue-300 group-hover:text-blue-100 transition-colors" />
                  </>
                )}
              </div>
            </div>
          </Link>
        </div>

        <div className={`border-t border-gray-800 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 h-0'}`} />

        {/* 配信者追加セクション */}
        <div className={isSidebarOpen ? 'sidebar-section space-y-3' : 'space-y-2'}>
          {/* 検索モーダルボタン */}
          <button
            onClick={() => isAuthenticated ? setIsSearchModalOpen(true) : setShowRegistrationPrompt(true)}
            className={`
              ${isSidebarOpen ? 'sidebar-btn' : 'sidebar-btn-collapsed'}
              ${isSidebarOpen
                ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 border border-purple-500/30 hover:border-purple-500/50'
                : 'bg-purple-600/20 hover:bg-purple-600/30'
              }
              focus:ring-purple-500
            `}
          >
            <div className={`flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}>
              <Search className="w-5 h-5 text-purple-400 flex-shrink-0" />
              {isSidebarOpen && (
                <span className="text-sm font-medium text-purple-100">
                  配信者を検索して追加
                </span>
              )}
            </div>
          </button>

          <div className={`border-t border-gray-800 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 h-0'}`} />

          {/* ゲームから追加 */}
          <button
            onClick={() => isAuthenticated ? setIsGameModalOpen(true) : setShowRegistrationPrompt(true)}
            className={`
              ${isSidebarOpen ? 'sidebar-btn' : 'sidebar-btn-collapsed'}
              ${isSidebarOpen
                ? 'bg-gradient-to-r from-green-600/20 to-emerald-600/20 hover:from-green-600/30 hover:to-emerald-600/30 border border-green-500/30 hover:border-green-500/50'
                : 'bg-green-600/20 hover:bg-green-600/30'
              }
              focus:ring-green-500
            `}
          >
            <div className={`flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}>
              <Gamepad2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              {isSidebarOpen && (
                <span className="text-sm font-medium text-green-100 whitespace-nowrap">
                  {LABELS.SECTIONS.GAME_BASED_ADD}
                </span>
              )}
            </div>
          </button>
        </div>

        <div className={`border-t border-gray-800 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 h-0'}`} />

        {/* お気に入りクリップセクション */}
        <div className={isSidebarOpen ? 'sidebar-section' : ''}>
          {isAuthenticated ? (
            <Link href={ROUTES.FAVORITES_CLIPS} className="block">
              <div className={`
                ${isSidebarOpen ? 'sidebar-btn' : 'sidebar-btn-collapsed'}
                ${isSidebarOpen
                  ? 'bg-gradient-to-r from-pink-600/20 to-rose-600/20 hover:from-pink-600/30 hover:to-rose-600/30 active:from-pink-600/40 active:to-rose-600/40 border border-pink-500/30 hover:border-pink-500/50'
                  : 'bg-pink-600/20 hover:bg-pink-600/30 active:bg-pink-600/40'
                }
                focus:ring-pink-500 group cursor-pointer
              `}>
                <div className={`flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}>
                  <ThumbsUp className="w-5 h-5 text-pink-400 flex-shrink-0" />
                  {isSidebarOpen && (
                    <>
                      <span className="text-sm font-medium text-pink-100 flex-1">
                        {LABELS.SECTIONS.FAVORITE_CLIPS}
                      </span>
                      <ChevronRight className="w-4 h-4 text-pink-300 group-hover:text-pink-100 transition-colors" />
                    </>
                  )}
                </div>
              </div>
            </Link>
          ) : (
            <button onClick={() => setShowRegistrationPrompt(true)} className="w-full">
              <div className={`
                ${isSidebarOpen ? 'sidebar-btn' : 'sidebar-btn-collapsed'}
                ${isSidebarOpen
                  ? 'bg-gradient-to-r from-pink-600/20 to-rose-600/20 hover:from-pink-600/30 hover:to-rose-600/30 border border-pink-500/30 hover:border-pink-500/50'
                  : 'bg-pink-600/20 hover:bg-pink-600/30'
                }
                focus:ring-pink-500 group cursor-pointer
              `}>
                <div className={`flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}>
                  <ThumbsUp className="w-5 h-5 text-pink-400 flex-shrink-0" />
                  {isSidebarOpen && (
                    <span className="text-sm font-medium text-pink-100 flex-1 text-left">
                      {LABELS.SECTIONS.FAVORITE_CLIPS}
                    </span>
                  )}
                </div>
              </div>
            </button>
          )}
        </div>

        <div className={`border-t border-gray-800 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 h-0'}`} />

        {/* お気に入り配信者セクション */}
        <div className={isSidebarOpen ? 'sidebar-section' : ''}>
          {isAuthenticated ? (
            <Link href={ROUTES.FAVORITES} className="block">
              <div className={`
                ${isSidebarOpen ? 'sidebar-btn' : 'sidebar-btn-collapsed'}
                ${isSidebarOpen
                  ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 active:from-purple-600/40 active:to-pink-600/40 border border-purple-500/30 hover:border-purple-500/50'
                  : 'bg-purple-600/20 hover:bg-purple-600/30 active:bg-purple-600/40'
                }
                focus:ring-purple-500 group cursor-pointer
              `}>
                <div className={`flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}>
                  <Heart className="w-5 h-5 text-purple-400 flex-shrink-0" />
                  {isSidebarOpen && (
                    <>
                      <span className="text-sm font-medium text-purple-100 flex-1">
                        {LABELS.SECTIONS.FAVORITE_STREAMERS}
                      </span>
                      <ChevronRight className="w-4 h-4 text-purple-300 group-hover:text-purple-100 transition-colors" />
                    </>
                  )}
                </div>
              </div>
            </Link>
          ) : (
            <button onClick={() => setShowRegistrationPrompt(true)} className="w-full">
              <div className={`
                ${isSidebarOpen ? 'sidebar-btn' : 'sidebar-btn-collapsed'}
                ${isSidebarOpen
                  ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 border border-purple-500/30 hover:border-purple-500/50'
                  : 'bg-purple-600/20 hover:bg-purple-600/30'
                }
                focus:ring-purple-500 group cursor-pointer
              `}>
                <div className={`flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}>
                  <Heart className="w-5 h-5 text-purple-400 flex-shrink-0" />
                  {isSidebarOpen && (
                    <span className="text-sm font-medium text-purple-100 flex-1 text-left">
                      {LABELS.SECTIONS.FAVORITE_STREAMERS}
                    </span>
                  )}
                </div>
              </div>
            </button>
          )}
        </div>

        <div className={`border-t border-gray-800 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 h-0'}`} />

        {/* 現在LIVE中の配信者セクション */}
        <div className={isSidebarOpen ? 'sidebar-section' : ''}>
          <div className={`
            ${isSidebarOpen ? 'sidebar-btn' : 'sidebar-btn-collapsed'}
            ${isSidebarOpen
              ? 'bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-500/30'
              : 'bg-red-600/20'
            }
          `}>
            <div className={`flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}>
              <Radio className="w-5 h-5 text-red-400 flex-shrink-0" />
              {isSidebarOpen && (
                <span className="text-sm font-medium text-red-100">
                  現在LIVE中
                </span>
              )}
            </div>
          </div>
          {isSidebarOpen && (
            <div className="mt-3">
              {isAuthenticated ? (
                <LiveStreamerList />
              ) : (
                <p className="text-xs text-gray-500 text-center py-2">
                  {LABELS.REGISTRATION.LIVE_HINT}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 配信者検索モーダル */}
      {onAddFavorite && (
        <StreamerSearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
          onSelectStreamer={(streamer) => {
            onAddFavorite(streamer);
          }}
          addedStreamerIds={favoriteStreamerIds}
        />
      )}

      {/* ゲームベース追加モーダル */}
      <GameBasedAddModal
        isOpen={isGameModalOpen}
        onClose={() => setIsGameModalOpen(false)}
        onAddStreamers={handleAddStreamersFromGames}
      />

      {/* 登録促進モーダル（未認証時） */}
      <RegistrationPromptModal
        isOpen={showRegistrationPrompt}
        onClose={() => setShowRegistrationPrompt(false)}
      />
    </aside>
  );
}
