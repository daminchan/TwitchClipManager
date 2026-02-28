// - YouTube風レイアウト: コンテンツのみ

'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { ArrowLeft, Folder as FolderIcon, Plus, Edit2, Trash2, Users, GripVertical, Twitch, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FolderCreateModal } from '@/components/folders/folder-create-modal';
import { FolderEditModal } from '@/components/folders/folder-edit-modal';
import { FolderDeleteConfirm } from '@/components/folders/folder-delete-confirm';
import { FolderStreamersModal } from '@/components/folders/folder-streamers-modal';
import { StreamerDeleteConfirm } from '@/components/streamers/streamer-delete-confirm';
import { useDragContext, useFolderContext } from '@/components/layout/authenticated-layout';
import { staggerContainer, fadeInUp } from '@/lib/animations';
import { API_ENDPOINTS, ROUTES, LABELS } from '@/lib/constants';
import { getFolders } from '@/actions/folders';
import type { FavoriteStreamer, Folder } from '@/types/database';

export function FavoritesContent() {
  const queryClient = useQueryClient();
  const { isDragging } = useDragContext();
  const { onFolderIdResolved } = useFolderContext();
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<Folder | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);
  const [folderToView, setFolderToView] = useState<Folder | null>(null);
  const [streamerToDelete, setStreamerToDelete] = useState<FavoriteStreamer | null>(null);

  // お気に入り配信者を取得（サイドバーと同じキャッシュを使用）
  const { data: favorites = [], isLoading } = useQuery<FavoriteStreamer[]>({
    queryKey: ['favorites'],
    queryFn: async () => {
      const res = await fetch(API_ENDPOINTS.FAVORITES, {
        cache: 'no-store',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch favorites');
      const result = await res.json();
      return result.data as FavoriteStreamer[];
    },
  });

  // フォルダ一覧を取得
  const { data: foldersResult } = useQuery({
    queryKey: ['folders'],
    queryFn: () => getFolders(),
  });

  const folders: Folder[] = foldersResult?.data || [];

  const handleFolderCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['folders'] });
  };

  const handleFolderEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['folders'] });
    setFolderToEdit(null);
  };

  const handleFolderDeleteSuccess = (deletedFolderId: string) => {
    // 楽観的UI: キャッシュから削除
    queryClient.setQueryData<{ data: Folder[] }>(['folders'], (oldData) => {
      if (!oldData?.data) return oldData;
      return {
        ...oldData,
        data: oldData.data.filter((f: Folder) => f.id !== deletedFolderId),
      };
    });
    setFolderToDelete(null);
  };

  const handleViewStreamersSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['folders'] });
  };

  const handleStreamerDeleteSuccess = (deletedStreamerId: string) => {
    // 楽観的UI: お気に入りキャッシュから削除
    queryClient.setQueryData(['favorites'], (oldData: FavoriteStreamer[] | undefined) => {
      if (!oldData) return oldData;
      return oldData.filter((f) => f.streamerId !== deletedStreamerId);
    });

    // 楽観的UI: 全フォルダからも削除（サーバー側でも同時削除されるため）
    queryClient.setQueryData<{ data: Folder[] }>(['folders'], (oldData) => {
      if (!oldData?.data) return oldData;
      return {
        ...oldData,
        data: oldData.data.map((folder: Folder) => ({
          ...folder,
          folderStreamers: folder.folderStreamers?.filter(
            (fs) => fs.streamerId !== deletedStreamerId
          ) || [],
        })),
      };
    });

    // クリップも再取得（バックグラウンド）
    queryClient.invalidateQueries({
      queryKey: ['clips', 'favorites'],
      refetchType: 'active',
    });
    setStreamerToDelete(null);
  };

  return (
    <div className="w-full px-3 py-4 pb-24 lg:pb-4">
      {/* 戻るボタン */}
      <div className="mb-6">
        <Link href={ROUTES.DASHBOARD}>
          <Button
            variant="ghost"
            className="text-[#a09890] hover:text-[#44403c] hover:bg-[#ebe5dc] active:bg-[#e0d9cf] active:text-[#6b655c] button-press-feedback"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {LABELS.CONFIRM.BACK_TO_CLIPS}
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#44403c] mb-2">
          お気に入り配信者
        </h1>
        <p className="text-[#a09890]">
          {LABELS.MESSAGES.FAVORITES_PAGE_DESC}
        </p>
      </div>

      {/* フォルダ一覧セクション */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FolderIcon className="w-5 h-5 text-[#8a8078]" />
            <h2 className="text-lg font-semibold text-[#44403c]">フォルダ</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFolderModalOpen(true)}
            className="text-[#8a8078] hover:text-[#6b655c] hover:bg-[#ebe5dc]"
          >
            <Plus className="w-4 h-4 mr-1" />
            {LABELS.BUTTONS.NEW_CREATE}
          </Button>
        </div>

        {folders.length === 0 ? (
          <div className="text-center py-8 bg-[#faf8f5] rounded-lg border border-[#e6e0d6]">
            <FolderIcon className="w-12 h-12 text-[#c4bdb2] mx-auto mb-3" />
            <p className="text-[#6b655c] text-sm">{LABELS.FOLDERS.NO_FOLDERS}</p>
            <p className="text-[#a09890] text-xs mt-1">{LABELS.FOLDERS.NO_FOLDERS_DESC}</p>
          </div>
        ) : (
          <motion.div
            className="grid-folders"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {folders.map((folder) => (
              <motion.div key={folder.id} variants={fadeInUp}>
                <DroppableFolderCard
                  folder={folder}
                  isDragging={isDragging}
                  onView={() => setFolderToView(folder)}
                  onEdit={() => setFolderToEdit(folder)}
                  onDelete={() => setFolderToDelete(folder)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* 区切り線 */}
      <div className="border-t border-[#e6e0d6] my-8"></div>

      {/* 配信者セクション */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-[#44403c]">すべての配信者</h2>
      </div>

      {isLoading ? (
        <div className="grid-streamers">
          {[...Array(16)].map((_, i) => (
            <div
              key={i}
              className="bg-[#faf8f5] rounded-lg p-4 animate-pulse"
            >
              <div className="w-24 h-24 bg-[#ebe5dc] rounded-full mx-auto mb-3"></div>
              <div className="h-4 bg-[#ebe5dc] rounded mb-2"></div>
              <div className="h-3 bg-[#ebe5dc] rounded"></div>
            </div>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[#6b655c] mb-4">お気に入り配信者がまだいません</p>
          <p className="text-sm text-[#a09890]">
            サイドバーから配信者を追加してください
          </p>
        </div>
      ) : (
        <motion.div
          className="grid-streamers"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {favorites.map((favorite) => (
            <motion.div key={favorite.id} variants={fadeInUp}>
              <DraggableStreamerCard
                favorite={favorite}
                onDelete={() => setStreamerToDelete(favorite)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* フォルダ作成モーダル */}
      <FolderCreateModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onSuccess={handleFolderCreated}
        onFolderIdResolved={onFolderIdResolved}
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

      {/* 配信者削除確認モーダル */}
      <StreamerDeleteConfirm
        isOpen={!!streamerToDelete}
        streamer={streamerToDelete}
        onClose={() => setStreamerToDelete(null)}
        onSuccess={handleStreamerDeleteSuccess}
      />
    </div>
  );
}

// ドラッグ可能な配信者カード
interface DraggableStreamerCardProps {
  favorite: FavoriteStreamer;
  onDelete: () => void;
}

function DraggableStreamerCard({ favorite, onDelete }: DraggableStreamerCardProps) {
  // temp-で始まるIDは同期中（楽観的UI追加中）
  const isSyncing = favorite.id.startsWith('temp-');

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: favorite.id,
    data: {
      streamer: favorite,
    },
    disabled: isSyncing, // 同期中はドラッグ不可
  });

  // Twitchページを開く
  const handleTwitchClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSyncing) return; // 同期中は無効
    window.open(`https://twitch.tv/${favorite.streamerLogin}`, '_blank');
  };

  // TODO: 配信者個別ページへのリンク（未実装）
  const handleStreamerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isSyncing) return; // 同期中は無効
    // TODO: 将来的に /streamers/[id] へ遷移
  };

  return (
    <div
      ref={setNodeRef}
      className={`relative ${isDragging ? 'opacity-10' : ''}`}
    >
      <div className={`group rounded-lg p-4 transition-all duration-200 ${
        isSyncing
          ? 'bg-[#faf8f5]/50 cursor-not-allowed'
          : 'bg-[#faf8f5] hover:bg-[#ebe5dc] hover:shadow-lg hover:shadow-[#c4bdb2]/20'
      }`}>
        {/* 同期中バッジ */}
        {isSyncing && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
            <span className="flex items-center gap-1 text-xs text-[#6890a8] bg-[#e4e9ee] px-2 py-0.5 rounded-full">
              <div className="animate-spin"><RefreshCw className="w-3 h-3" /></div>
              {LABELS.BUTTONS.ADDING}
            </span>
          </div>
        )}

        {/* ドラッグハンドル（アイコン部分のみ） */}
        {/* touch-none: モバイルのネイティブ動作を無効化 */}
        {/* -webkit-touch-callout: none: iOSのコンテキストメニューを無効化 */}
        <div
          {...(isSyncing ? {} : listeners)}
          {...(isSyncing ? {} : attributes)}
          className={`relative w-24 h-24 mx-auto mb-3 touch-none select-none ${
            isSyncing ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing'
          }`}
          style={{ WebkitTouchCallout: 'none' }}
        >
          {/* ドラッグインジケーター（ホバー時表示、同期中は非表示） */}
          {!isSyncing && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
              <div className="absolute inset-0 bg-[#44403c]/30 rounded-full" />
              <GripVertical className="w-6 h-6 text-white drop-shadow-lg" />
            </div>
          )}

          {favorite.streamerImage ? (
            <Image
              src={favorite.streamerImage}
              alt={favorite.streamerName}
              fill
              className="rounded-full object-cover pointer-events-none"
              sizes="96px"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full rounded-full bg-[#c4bdb2] flex items-center justify-center pointer-events-none">
              <span className="text-2xl text-white font-bold">
                {favorite.streamerName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* 配信者名（クリックで個別ページへ - 未実装） */}
        <button
          onClick={handleStreamerClick}
          disabled={isSyncing}
          className={`w-full text-center transition-colors ${
            isSyncing
              ? 'opacity-50 cursor-not-allowed'
              : 'group/link hover:text-purple-400'
          }`}
        >
          <p className={`text-sm font-semibold line-clamp-1 mb-1 ${
            isSyncing ? 'text-[#b8b0a6]' : 'text-[#44403c] group-hover/link:text-[#6b655c]'
          }`}>
            {favorite.streamerName}
          </p>
          <p className={`text-xs line-clamp-1 ${
            isSyncing ? 'text-[#b8b0a6]' : 'text-[#a09890] group-hover/link:text-[#6b655c]'
          }`}>
            @{favorite.streamerLogin}
          </p>
        </button>

        {/* アクションボタン（右上、同期中は非表示） */}
        {!isSyncing && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
            {/* Twitchへリンク */}
            <button
              onClick={handleTwitchClick}
              className="p-1.5 bg-[#8a8078]/80 hover:bg-[#7a706a] rounded-full transition-colors"
              aria-label="Twitchで開く"
            >
              <Twitch className="w-3 h-3 text-white" />
            </button>
            {/* 削除ボタン */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 bg-[#ebe5dc]/80 hover:bg-red-50 rounded-full transition-colors"
              aria-label="お気に入りから削除"
            >
              <Trash2 className="w-3 h-3 text-[#a09890] hover:text-red-400" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ドロップ可能なフォルダカード
interface DroppableFolderCardProps {
  folder: Folder;
  isDragging: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function DroppableFolderCard({ folder, isDragging, onView, onEdit, onDelete }: DroppableFolderCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // 作成中フォルダ（temp-で始まるID）はD&D不可
  const isPending = folder.id.startsWith('temp-');

  const { setNodeRef, isOver } = useDroppable({
    id: folder.id,
    data: {
      type: 'folder',
      folder,
    },
  });

  const streamerCount = folder.folderStreamers?.length || 0;

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div
      ref={setNodeRef}
      onClick={isPending ? undefined : onView}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative bg-[#faf8f5] rounded-lg p-4 transition-all duration-200 border border-[#e6e0d6]
        ${isPending
          ? 'opacity-70 cursor-default'
          : 'cursor-pointer'
        }
        ${isDragging
          ? 'ring-2 ring-[#6890a8] ring-opacity-50 animate-pulse'
          : !isPending ? 'hover:bg-[#ebe5dc] hover:scale-105 hover:shadow-lg hover:shadow-[#c4bdb2]/20' : ''
        }
        ${isOver ? 'bg-[#e4e9ee] ring-2 ring-[#6890a8] scale-105' : ''}
      `}
    >
      {/* 作成中インジケーター */}
      {isPending && (
        <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
          <div className="w-3 h-3 border-2 border-[#6890a8] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-[#6890a8]">作成中...</span>
        </div>
      )}

      {/* アクションボタン（ホバー時表示、作成中は非表示） */}
      {isHovered && !isDragging && !isPending && (
        <div className="absolute top-2 right-2 flex gap-1 z-10">
          <button
            onClick={handleEdit}
            className="p-1.5 bg-[#ebe5dc]/80 hover:bg-[#e0d9cf] rounded transition-colors"
            aria-label="フォルダを編集"
          >
            <Edit2 className="w-3.5 h-3.5 text-[#6b655c] hover:text-[#44403c]" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 bg-[#ebe5dc]/80 hover:bg-red-50 rounded transition-colors"
            aria-label="フォルダを削除"
          >
            <Trash2 className="w-3.5 h-3.5 text-[#6b655c] hover:text-red-400" />
          </button>
        </div>
      )}

      {/* フォルダアイコン */}
      <div className="flex justify-center mb-3">
        <div
          className="w-16 h-16 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${folder.color}20` }}
        >
          <FolderIcon
            className="w-10 h-10"
            style={{ color: folder.color }}
          />
        </div>
      </div>

      {/* フォルダ名 */}
      <p className="text-center text-sm font-semibold text-[#44403c] line-clamp-1 mb-1">
        {folder.name}
      </p>
      <div className="flex items-center justify-center gap-1 text-xs text-[#a09890]">
        <Users className="w-3 h-3" />
        <span>{streamerCount}人</span>
      </div>
    </div>
  );
}
