// - CSS共通クラス使用（sidebar-btn, sidebar-section）

'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Search, Folder, ThumbsUp, Gamepad2, Radio, ChevronRight, Play } from 'lucide-react';
import { LiveStreamerList } from '@/components/streamers/live-streamer-list';

// モーダルを遅延読み込み（bundle-dynamic-imports）
const StreamerSearchModal = dynamic(
  () => import('@/components/streamers/streamer-search-modal').then(m => ({ default: m.StreamerSearchModal })),
  { ssr: false }
);
const GameBasedAddModal = dynamic(
  () => import('@/components/sidebar/game-based-add-modal').then(m => ({ default: m.GameBasedAddModal })),
  { ssr: false }
);
const RegistrationPromptModal = dynamic(
  () => import('@/components/auth/registration-prompt-modal').then(m => ({ default: m.RegistrationPromptModal })),
  { ssr: false }
);
import { addMultipleFavoriteStreamers } from '@/actions/favorites';
import { LABELS, ROUTES } from '@/lib/constants';
import type { TwitchChannel, RecommendedStreamer } from '@/types/twitch';

const EMPTY_STREAMER_IDS: string[] = [];

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
  favoriteStreamerIds = EMPTY_STREAMER_IDS,
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

    // 追加完了後にデータを並列で再取得
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['favorites'] }),
      queryClient.invalidateQueries({
        queryKey: ['clips', 'favorites'],
        refetchType: 'active',
      }),
    ]);

    return result;
  };

  return (
    <aside
      className={`
        ${isSidebarOpen ? 'w-80' : 'w-20'}
        hidden lg:block h-full
        bg-[#f2ede6] border-r border-[#e6e0d6] overflow-y-auto overflow-x-hidden flex-shrink-0 transition-[width] duration-300 ease-in-out
      `}
    >
      <div className={`p-4 space-y-4 ${isSidebarOpen ? 'min-w-[288px]' : 'min-w-[48px]'}`}>
        {/* クリップ一覧ボタン — くすみブルー */}
        <div className={isSidebarOpen ? 'sidebar-section' : ''}>
          <Link href={ROUTES.HOME} className="block">
            <div className={`
              ${isSidebarOpen ? 'sidebar-btn' : 'sidebar-btn-collapsed'}
              ${isClipListActive
                ? isSidebarOpen
                  ? 'bg-[#dce4ea] border border-[#b8c8d4]'
                  : 'bg-[#dce4ea]'
                : isSidebarOpen
                  ? 'bg-[#e4e9ee]/60 hover:bg-[#dce4ea]/80 border border-[#c8d4de] hover:border-[#b8c8d4]'
                  : 'bg-[#e4e9ee]/60 hover:bg-[#dce4ea]/80'
              }
              focus:ring-[#a0b8c8] group cursor-pointer
            `}>
              <div className={`flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}>
                <Play className="w-5 h-5 text-[#6890a8] flex-shrink-0" />
                {isSidebarOpen && (
                  <>
                    <span className="text-sm font-medium text-[#507088] flex-1">
                      {LABELS.SECTIONS.CLIP_LIST}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#90aab8] group-hover:text-[#507088] transition-colors" />
                  </>
                )}
              </div>
            </div>
          </Link>
        </div>

        <div className={`border-t border-[#e6e0d6] transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 h-0'}`} />

        {/* 配信者追加セクション */}
        <div className={isSidebarOpen ? 'sidebar-section space-y-3' : 'space-y-2'}>
          {/* 検索モーダルボタン — くすみパープル */}
          <button
            onClick={() => isAuthenticated ? setIsSearchModalOpen(true) : setShowRegistrationPrompt(true)}
            className={`
              ${isSidebarOpen ? 'sidebar-btn' : 'sidebar-btn-collapsed'}
              ${isSidebarOpen
                ? 'bg-[#e8e2ee]/60 hover:bg-[#dfd6e8]/80 border border-[#d0c0da] hover:border-[#baa8c8]'
                : 'bg-[#e8e2ee]/60 hover:bg-[#dfd6e8]/80'
              }
              focus:ring-[#baa8c8]
            `}
          >
            <div className={`flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}>
              <Search className="w-5 h-5 text-[#8868a8] flex-shrink-0" />
              {isSidebarOpen && (
                <span className="text-sm font-medium text-[#6e5088]">
                  配信者を検索して追加
                </span>
              )}
            </div>
          </button>

          <div className={`border-t border-[#e6e0d6] transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 h-0'}`} />

          {/* ゲームから追加 — くすみグリーン */}
          <button
            onClick={() => isAuthenticated ? setIsGameModalOpen(true) : setShowRegistrationPrompt(true)}
            className={`
              ${isSidebarOpen ? 'sidebar-btn' : 'sidebar-btn-collapsed'}
              ${isSidebarOpen
                ? 'bg-[#e0ece4]/60 hover:bg-[#d4e4d8]/80 border border-[#b8d0c0] hover:border-[#a0c0aa]'
                : 'bg-[#e0ece4]/60 hover:bg-[#d4e4d8]/80'
              }
              focus:ring-[#a0c0aa]
            `}
          >
            <div className={`flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}>
              <Gamepad2 className="w-5 h-5 text-[#5a9a70] flex-shrink-0" />
              {isSidebarOpen && (
                <span className="text-sm font-medium text-[#48805a] whitespace-nowrap">
                  {LABELS.SECTIONS.GAME_BASED_ADD}
                </span>
              )}
            </div>
          </button>
        </div>

        <div className={`border-t border-[#e6e0d6] transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 h-0'}`} />

        {/* お気に入りクリップセクション — くすみローズ */}
        <div className={isSidebarOpen ? 'sidebar-section' : ''}>
          {isAuthenticated ? (
            <Link href={ROUTES.FAVORITES_CLIPS} className="block">
              <div className={`
                ${isSidebarOpen ? 'sidebar-btn' : 'sidebar-btn-collapsed'}
                ${isSidebarOpen
                  ? 'bg-[#eee2e4]/60 hover:bg-[#e6d6da]/80 active:bg-[#deccce] border border-[#dac0c6] hover:border-[#c8a8b0]'
                  : 'bg-[#eee2e4]/60 hover:bg-[#e6d6da]/80 active:bg-[#deccce]'
                }
                focus:ring-[#c8a8b0] group cursor-pointer
              `}>
                <div className={`flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}>
                  <ThumbsUp className="w-5 h-5 text-[#b06878] flex-shrink-0" />
                  {isSidebarOpen && (
                    <>
                      <span className="text-sm font-medium text-[#905060] flex-1">
                        {LABELS.SECTIONS.FAVORITE_CLIPS}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#c09098] group-hover:text-[#905060] transition-colors" />
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
                  ? 'bg-[#eee2e4]/60 hover:bg-[#e6d6da]/80 border border-[#dac0c6] hover:border-[#c8a8b0]'
                  : 'bg-[#eee2e4]/60 hover:bg-[#e6d6da]/80'
                }
                focus:ring-[#c8a8b0] group cursor-pointer
              `}>
                <div className={`flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}>
                  <ThumbsUp className="w-5 h-5 text-[#b06878] flex-shrink-0" />
                  {isSidebarOpen && (
                    <span className="text-sm font-medium text-[#905060] flex-1 text-left">
                      {LABELS.SECTIONS.FAVORITE_CLIPS}
                    </span>
                  )}
                </div>
              </div>
            </button>
          )}
        </div>

        <div className={`border-t border-[#e6e0d6] transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 h-0'}`} />

        {/* お気に入り配信者セクション — くすみモーヴ */}
        <div className={isSidebarOpen ? 'sidebar-section' : ''}>
          {isAuthenticated ? (
            <Link href={ROUTES.FAVORITES} className="block">
              <div className={`
                ${isSidebarOpen ? 'sidebar-btn' : 'sidebar-btn-collapsed'}
                ${isSidebarOpen
                  ? 'bg-[#eae0ec]/60 hover:bg-[#e0d4e4]/80 active:bg-[#d8cada] border border-[#d0c0d6] hover:border-[#baa8c2]'
                  : 'bg-[#eae0ec]/60 hover:bg-[#e0d4e4]/80 active:bg-[#d8cada]'
                }
                focus:ring-[#baa8c2] group cursor-pointer
              `}>
                <div className={`flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}>
                  <Folder className="w-5 h-5 text-[#9868a0] flex-shrink-0" />
                  {isSidebarOpen && (
                    <>
                      <span className="text-sm font-medium text-[#7a5085] flex-1">
                        {LABELS.SECTIONS.FAVORITE_STREAMERS}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#b890b8] group-hover:text-[#7a5085] transition-colors" />
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
                  ? 'bg-[#eae0ec]/60 hover:bg-[#e0d4e4]/80 border border-[#d0c0d6] hover:border-[#baa8c2]'
                  : 'bg-[#eae0ec]/60 hover:bg-[#e3ddd4]/80'
                }
                focus:ring-[#baa8c2] group cursor-pointer
              `}>
                <div className={`flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}>
                  <Folder className="w-5 h-5 text-[#9868a0] flex-shrink-0" />
                  {isSidebarOpen && (
                    <span className="text-sm font-medium text-[#7a5085] flex-1 text-left">
                      {LABELS.SECTIONS.FAVORITE_STREAMERS}
                    </span>
                  )}
                </div>
              </div>
            </button>
          )}
        </div>

        <div className={`border-t border-[#e6e0d6] transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 h-0'}`} />

        {/* 現在LIVE中の配信者セクション — くすみテラコッタ */}
        <div className={isSidebarOpen ? 'sidebar-section' : ''}>
          <div className={`
            ${isSidebarOpen ? 'sidebar-btn' : 'sidebar-btn-collapsed'}
            ${isSidebarOpen
              ? 'bg-[#f0e4e0]/60 border border-[#dcc0b8]'
              : 'bg-[#f0e4e0]/60'
            }
          `}>
            <div className={`flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}>
              <Radio className="w-5 h-5 text-[#c07060] flex-shrink-0" />
              {isSidebarOpen && (
                <span className="text-sm font-medium text-[#984838]">
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
                <p className="text-xs text-[#a09890] text-center py-2">
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
