// - YouTube風統一ヘッダー（全ページ共通）

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Settings, Menu, LogOut, Search, Gamepad2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StreamerSearchModal } from '@/components/streamers/streamer-search-modal';
import { GameBasedAddModal } from '@/components/sidebar/game-based-add-modal';
import { APP_CONFIG, ROUTES, API_ENDPOINTS, CACHE_TIME } from '@/lib/constants';
import { useFavoriteActions } from '@/hooks/use-favorite-actions';
import { useToast } from '@/hooks/use-toast';
import { Toast } from '@/components/ui/toast';
import { addMultipleFavoriteStreamers } from '@/actions/favorites';
import type { TwitchChannel, RecommendedStreamer } from '@/types/twitch';
import type { FavoriteStreamer } from '@/types/database';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { handleAddFavorite: addFavorite } = useFavoriteActions();
  const { toast, showToast, hideToast } = useToast();

  // モーダル状態（モバイル用）
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);

  // お気に入り配信者のIDリスト
  const { data: favoritesData } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const response = await fetch(API_ENDPOINTS.FAVORITES, {
        method: 'GET',
        credentials: 'include',
      });
      if (!response.ok) return [];
      const result = await response.json();
      return result.data as FavoriteStreamer[];
    },
    staleTime: CACHE_TIME.DEFAULT_STALE_TIME,
  });

  const favoriteStreamerIds = useMemo(
    () => favoritesData?.map((f) => f.streamerId) ?? [],
    [favoritesData]
  );

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  // 配信者追加
  const handleAddStreamer = async (streamer: TwitchChannel) => {
    await addFavorite(
      streamer,
      (message) => showToast(message, 'success'),
      (message, type) => showToast(message, type)
    );
  };

  // ゲームから配信者追加
  const handleAddStreamersFromGames = async (streamers: RecommendedStreamer[]) => {
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

    await queryClient.invalidateQueries({ queryKey: ['favorites'] });
    await queryClient.invalidateQueries({
      queryKey: ['clips', 'favorites'],
      refetchType: 'active'
    });

    return result;
  };

  return (
    <>
    <header className="sticky top-0 z-50 w-full border-b border-[#e6e0d6] bg-[#f2ede6]">
      <div className="flex h-16 items-center px-4 md:px-6 w-full gap-4 justify-between">
        {/* 左側: ハンバーガー + タイトル */}
        <div className="flex items-center gap-3">
          {/* ハンバーガーメニュー（デスクトップのみ） */}
          {onToggleSidebar ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSidebar}
              className="hidden lg:flex p-2 hover:bg-[#ebe5dc]"
              aria-label="サイドバーを切り替え"
            >
              <Menu className="w-6 h-6 text-[#44403c]" />
            </Button>
          ) : null}

          <Link href="/" className="flex items-center flex-shrink-0">
            <div className="text-xl md:text-2xl font-bold text-[#5a524a]">
              {APP_CONFIG.name}
            </div>
          </Link>
        </div>

        {/* 右側: ユーザー情報 or ログインボタン */}
        {!session?.user ? (
          <div className="flex items-center gap-2">
            <Link href={ROUTES.LOGIN}>
              <Button
                variant="outline"
                size="sm"
                className="text-sm bg-[#8a8078] hover:bg-[#7a706a] text-white border-0 button-press-feedback"
              >
                ログイン / 登録
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2 md:gap-3">
            {/* モバイル用ボタン */}
            <div className="flex lg:hidden items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSearchModalOpen(true)}
                className="p-2 text-[#9e92a8] hover:text-[#7e7289] hover:bg-[#ebe5dc]"
                aria-label="配信者を検索"
              >
                <Search className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsGameModalOpen(true)}
                className="p-2 text-[#88a090] hover:text-[#6a806f] hover:bg-[#ebe5dc]"
                aria-label="ゲームから配信者を追加"
              >
                <Gamepad2 className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="p-2 text-[#a09890] hover:text-[#6b655c] hover:bg-[#ebe5dc]"
                aria-label="ログアウト"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>

            {/* デスクトップ表示 */}
            <div className="hidden lg:flex items-center gap-2">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-[#a09890] text-white text-sm">
                  {session.user.name?.[0]?.toUpperCase() || session.user.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-[#44403c]">
                {session.user.name || session.user.email}
              </span>
            </div>
            <Link href={ROUTES.SETTINGS} className="hidden lg:block">
              <Button
                variant="outline"
                size="sm"
                className="text-xs md:text-sm bg-transparent border-0 text-[#6b655c] hover:bg-[#ebe5dc] transition-all button-press-feedback active:scale-95"
              >
                <Settings className="w-4 h-4 md:mr-1" />
                <span className="hidden md:inline">設定</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="hidden lg:flex text-xs md:text-sm bg-transparent border-0 text-[#6b655c] hover:bg-[#ebe5dc] transition-all button-press-feedback active:scale-95"
            >
              ログアウト
            </Button>
          </div>
        )}

      </div>
    </header>

    {/* モバイル用モーダル */}
    <StreamerSearchModal
      isOpen={isSearchModalOpen}
      onClose={() => setIsSearchModalOpen(false)}
      onSelectStreamer={handleAddStreamer}
      addedStreamerIds={favoriteStreamerIds}
    />

    <GameBasedAddModal
      isOpen={isGameModalOpen}
      onClose={() => setIsGameModalOpen(false)}
      onAddStreamers={handleAddStreamersFromGames}
    />

    {/* トースト通知 */}
    {toast ? (
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    ) : null}
    </>
  );
}
