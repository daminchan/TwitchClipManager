// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション8.2: Props型定義

'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Search, Heart, ThumbsUp, Gamepad2, Folder as FolderIcon, Plus, ChevronRight } from 'lucide-react';
import { StreamerSearch } from '@/components/streamers/streamer-search';
import { FavoriteList } from '@/components/streamers/favorite-list';
import { GameBasedAddModal } from '@/components/sidebar/game-based-add-modal';
import { FolderCreateModal } from '@/components/folders/folder-create-modal';
import { FolderEditModal } from '@/components/folders/folder-edit-modal';
import { FolderDeleteConfirm } from '@/components/folders/folder-delete-confirm';
import { FolderStreamersModal } from '@/components/folders/folder-streamers-modal';
import { FolderList } from '@/components/folders/folder-list';
import { addMultipleFavoriteStreamers } from '@/actions/favorites';
import { LABELS, ROUTES } from '@/lib/constants';
import type { TwitchChannel, RecommendedStreamer } from '@/types/twitch';
import type { Folder } from '@/types/database';

interface DashboardSidebarProps {
  isSidebarOpen: boolean;
  onAddFavorite?: (streamer: TwitchChannel) => void;
  onRemoveFavorite?: () => void;
  isDragging?: boolean;
  selectedFolderId?: string | null;
  onFolderClick?: (folderId: string) => void;
}

export function DashboardSidebar({
  isSidebarOpen,
  onAddFavorite,
  onRemoveFavorite,
  isDragging = false,
  selectedFolderId,
  onFolderClick,
}: DashboardSidebarProps) {
  const queryClient = useQueryClient();
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<Folder | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);
  const [folderToView, setFolderToView] = useState<Folder | null>(null);

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

  const handleFolderCreated = async () => {
    // フォルダ一覧を再取得
    await queryClient.invalidateQueries({ queryKey: ['folders'] });
  };

  const handleFolderEdit = (folder: Folder) => {
    setFolderToEdit(folder);
  };

  const handleFolderEditSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: ['folders'] });
    setFolderToEdit(null);
  };

  const handleFolderDelete = (folder: Folder) => {
    setFolderToDelete(folder);
  };

  const handleFolderDeleteSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: ['folders'] });
    setFolderToDelete(null);
  };

  const handleViewStreamers = (folder: Folder) => {
    setFolderToView(folder);
  };

  const handleViewStreamersSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: ['folders'] });
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
        {/* 配信者追加セクション（検索 + ゲーム） */}
        <div className={`${isSidebarOpen ? 'bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 space-y-4' : 'space-y-4'}`}>
          {/* 検索 */}
          <div>
            <div className="flex items-center gap-2">
              <Search className={`${isSidebarOpen ? 'w-5 h-5' : 'w-6 h-6'} text-gray-400 flex-shrink-0`} />
              {isSidebarOpen && (
                <h2 className="text-sm font-semibold text-gray-100 whitespace-nowrap">
                  {LABELS.SECTIONS.SEARCH_STREAMERS}
                </h2>
              )}
            </div>
            {isSidebarOpen && onAddFavorite && (
              <div className="mt-4">
                <StreamerSearch
                  onSelectStreamer={(streamer) => {
                    onAddFavorite(streamer);
                  }}
                />
              </div>
            )}
          </div>

          {/* 区切り線（枠内） */}
          {isSidebarOpen && (
            <div className="border-t border-gray-800"></div>
          )}

          {/* ゲームから追加 */}
          <button
            onClick={() => setIsGameModalOpen(true)}
            className={`
              ${isSidebarOpen ? 'w-full' : 'w-auto'}
              ${isSidebarOpen
                ? 'bg-gradient-to-r from-green-600/20 to-emerald-600/20 hover:from-green-600/30 hover:to-emerald-600/30 border border-green-500/30 hover:border-green-500/50'
                : 'bg-green-600/20 hover:bg-green-600/30'
              }
              rounded-lg p-4 transition-all duration-200 button-press-feedback
              focus:outline-none focus:ring-2 focus:ring-green-500/50
            `}
          >
            <div className="flex items-center gap-2">
              <Gamepad2 className={`${isSidebarOpen ? 'w-5 h-5' : 'w-6 h-6'} text-green-400 flex-shrink-0`} />
              {isSidebarOpen && (
                <h2 className="text-sm font-semibold text-green-100 whitespace-nowrap">
                  {LABELS.SECTIONS.GAME_BASED_ADD}
                </h2>
              )}
            </div>
          </button>
        </div>

        {/* 区切り線 */}
        {isSidebarOpen && (
          <div className="border-t border-gray-800"></div>
        )}

        {/* お気に入りクリップセクション */}
        <div className={`${isSidebarOpen ? 'bg-[#1a1a1a] border border-gray-800 rounded-lg p-4' : ''}`}>
          <Link href={ROUTES.FAVORITES_CLIPS} className="block">
            <div className={`
              ${isSidebarOpen ? 'w-full' : 'w-auto'}
              ${isSidebarOpen
                ? 'bg-gradient-to-r from-pink-600/20 to-rose-600/20 hover:from-pink-600/30 hover:to-rose-600/30 border border-pink-500/30 hover:border-pink-500/50'
                : 'bg-pink-600/20 hover:bg-pink-600/30'
              }
              rounded-lg p-4 transition-all duration-200 button-press-feedback
              focus:outline-none focus:ring-2 focus:ring-pink-500/50
              cursor-pointer
            `}>
              <div className="flex items-center gap-2">
                <ThumbsUp className={`${isSidebarOpen ? 'w-5 h-5' : 'w-6 h-6'} text-pink-400 flex-shrink-0`} />
                {isSidebarOpen && (
                  <h2 className="text-sm font-semibold text-pink-100 whitespace-nowrap">
                    {LABELS.SECTIONS.FAVORITE_CLIPS}
                  </h2>
                )}
              </div>
            </div>
          </Link>
        </div>

        {/* 区切り線 */}
        {isSidebarOpen && (
          <div className="border-t border-gray-800"></div>
        )}

        {/* お気に入り配信者セクション */}
        <div className={`${isSidebarOpen ? 'bg-[#1a1a1a] border border-gray-800 rounded-lg p-4' : ''}`}>
          <Link href={ROUTES.FAVORITES} className="block">
            <div className={`
              ${isSidebarOpen ? 'w-full' : 'w-auto'}
              ${isSidebarOpen
                ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 border border-purple-500/30 hover:border-purple-500/50'
                : 'bg-purple-600/20 hover:bg-purple-600/30'
              }
              rounded-lg p-4 transition-all duration-200 button-press-feedback
              focus:outline-none focus:ring-2 focus:ring-purple-500/50
              group cursor-pointer
            `}>
              <div className="flex items-center gap-2">
                <Heart className={`${isSidebarOpen ? 'w-5 h-5' : 'w-6 h-6'} text-purple-400 flex-shrink-0`} />
                {isSidebarOpen && (
                  <>
                    <h2 className="text-sm font-semibold text-purple-100 whitespace-nowrap flex-1">
                      {LABELS.SECTIONS.FAVORITE_STREAMERS}
                    </h2>
                    <ChevronRight className="w-4 h-4 text-purple-300 group-hover:text-purple-100 transition-colors" />
                  </>
                )}
              </div>
            </div>
          </Link>
          {isSidebarOpen && (
            <div className="mt-4">
              <FavoriteList
                onRemoveFavorite={onRemoveFavorite}
              />
            </div>
          )}
        </div>

        {/* 区切り線 */}
        {isSidebarOpen && (
          <div className="border-t border-gray-800"></div>
        )}

        {/* フォルダセクション */}
        <div className={`${isSidebarOpen ? 'bg-[#1a1a1a] border border-gray-800 rounded-lg p-4' : ''}`}>
          <div className={`
            ${isSidebarOpen ? 'w-full' : 'w-auto'}
            ${isSidebarOpen
              ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20 hover:from-blue-600/30 hover:to-cyan-600/30 border border-blue-500/30 hover:border-blue-500/50'
              : 'bg-blue-600/20 hover:bg-blue-600/30'
            }
            rounded-lg p-4 transition-all duration-200 button-press-feedback
          `}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1">
                <FolderIcon className={`${isSidebarOpen ? 'w-5 h-5' : 'w-6 h-6'} text-blue-400 flex-shrink-0`} />
                {isSidebarOpen && (
                  <h2 className="text-sm font-semibold text-blue-100 whitespace-nowrap">
                    フォルダ
                  </h2>
                )}
              </div>
              {isSidebarOpen && (
                <button
                  onClick={() => setIsFolderModalOpen(true)}
                  className="p-1 hover:bg-blue-500/20 rounded transition-colors button-press-feedback focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  aria-label="フォルダを作成"
                >
                  <Plus className="w-4 h-4 text-blue-300 hover:text-blue-100" />
                </button>
              )}
            </div>
          </div>
          {isSidebarOpen && (
            <div className="mt-4 space-y-2">
              <FolderList
                isDragging={isDragging}
                selectedFolderId={selectedFolderId}
                onFolderClick={onFolderClick}
                onFolderEdit={handleFolderEdit}
                onFolderDelete={handleFolderDelete}
                onViewStreamers={handleViewStreamers}
              />
            </div>
          )}
        </div>
      </div>

      {/* ゲームベース追加モーダル */}
      <GameBasedAddModal
        isOpen={isGameModalOpen}
        onClose={() => setIsGameModalOpen(false)}
        onAddStreamers={handleAddStreamersFromGames}
      />

      {/* フォルダ作成モーダル */}
      <FolderCreateModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onSuccess={handleFolderCreated}
      />

      {/* フォルダ編集モーダル */}
      <FolderEditModal
        isOpen={!!folderToEdit}
        folder={folderToEdit}
        onClose={() => setFolderToEdit(null)}
        onSuccess={handleFolderEditSuccess}
      />

      {/* フォルダ削除確認モーダル */}
      <FolderDeleteConfirm
        isOpen={!!folderToDelete}
        folder={folderToDelete}
        onClose={() => setFolderToDelete(null)}
        onSuccess={handleFolderDeleteSuccess}
      />

      {/* フォルダ内配信者表示モーダル */}
      <FolderStreamersModal
        isOpen={!!folderToView}
        folder={folderToView}
        onClose={() => setFolderToView(null)}
        onSuccess={handleViewStreamersSuccess}
      />
    </aside>
  );
}
