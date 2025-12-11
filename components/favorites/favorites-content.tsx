// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション10.2: サーバー/クライアントコンポーネント分離
// - YouTube風レイアウト: コンテンツのみ

'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { ArrowLeft, Folder as FolderIcon, Plus, Edit2, Trash2, Users, GripVertical, Twitch } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FolderCreateModal } from '@/components/folders/folder-create-modal';
import { FolderEditModal } from '@/components/folders/folder-edit-modal';
import { FolderDeleteConfirm } from '@/components/folders/folder-delete-confirm';
import { FolderStreamersModal } from '@/components/folders/folder-streamers-modal';
import { StreamerDeleteConfirm } from '@/components/streamers/streamer-delete-confirm';
import { API_ENDPOINTS, ROUTES, LABELS } from '@/lib/constants';
import { getFolders } from '@/actions/folders';
import { useDragContext } from '@/components/layout/authenticated-layout';

import type { FavoriteStreamer, Folder } from '@/types/database';

export function FavoritesContent() {
  const queryClient = useQueryClient();
  const { isDragging } = useDragContext();
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<Folder | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);
  const [folderToView, setFolderToView] = useState<Folder | null>(null);
  const [streamerToDelete, setStreamerToDelete] = useState<FavoriteStreamer | null>(null);
  const [showCards, setShowCards] = useState(false);

  // マウント後、カード表示アニメーション開始
  useEffect(() => {
    const timer = setTimeout(() => setShowCards(true), 50);
    return () => clearTimeout(timer);
  }, []);

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
    queryFn: async () => {
      return await getFolders();
    },
  });

  const folders: Folder[] = foldersResult?.data || [];

  const handleFolderCreated = async () => {
    await queryClient.invalidateQueries({ queryKey: ['folders'] });
  };

  const handleFolderEditSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: ['folders'] });
    setFolderToEdit(null);
  };

  const handleFolderDeleteSuccess = (deletedFolderId: string) => {
    // 楽観的UI: キャッシュから削除
    queryClient.setQueryData(['folders'], (oldData: any) => {
      if (!oldData?.data) return oldData;
      return {
        ...oldData,
        data: oldData.data.filter((f: Folder) => f.id !== deletedFolderId),
      };
    });
    setFolderToDelete(null);
  };

  const handleViewStreamersSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: ['folders'] });
  };

  const handleStreamerDeleteSuccess = async (deletedStreamerId: string) => {
    // 楽観的UI: キャッシュから削除
    queryClient.setQueryData(['favorites'], (oldData: FavoriteStreamer[] | undefined) => {
      if (!oldData) return oldData;
      return oldData.filter((f) => f.streamerId !== deletedStreamerId);
    });
    // クリップも再取得
    await queryClient.invalidateQueries({
      queryKey: ['clips', 'favorites'],
      refetchType: 'active'
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
            className="text-gray-400 hover:text-gray-100 hover:bg-[#1a1a1a] active:bg-[#2a2a2a] active:text-gray-300 button-press-feedback"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            クリップ一覧に戻る
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          お気に入り配信者
        </h1>
        <p className="text-gray-400">
          {LABELS.MESSAGES.FAVORITES_PAGE_DESC}
        </p>
      </div>

      {/* フォルダ一覧セクション */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FolderIcon className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-100">フォルダ</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFolderModalOpen(true)}
            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
          >
            <Plus className="w-4 h-4 mr-1" />
            新規作成
          </Button>
        </div>

        {folders.length === 0 ? (
          <div className="text-center py-8 bg-[#1a1a1a] rounded-lg border border-gray-800">
            <FolderIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">フォルダがありません</p>
            <p className="text-gray-500 text-xs mt-1">フォルダを作成して配信者を整理しましょう</p>
          </div>
        ) : (
          <div className="grid-folders">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className={showCards ? 'animate-card' : 'opacity-0'}
              >
                <DroppableFolderCard
                  folder={folder}
                  isDragging={isDragging}
                  onView={() => setFolderToView(folder)}
                  onEdit={() => setFolderToEdit(folder)}
                  onDelete={() => setFolderToDelete(folder)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 区切り線 */}
      <div className="border-t border-gray-800 my-8"></div>

      {/* 配信者セクション */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-100">すべての配信者</h2>
      </div>

      {isLoading ? (
        <div className="grid-streamers">
          {[...Array(16)].map((_, i) => (
            <div
              key={i}
              className="bg-[#1a1a1a] rounded-lg p-4 animate-pulse"
            >
              <div className="w-24 h-24 bg-gray-700 rounded-full mx-auto mb-3"></div>
              <div className="h-4 bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 mb-4">お気に入り配信者がまだいません</p>
          <p className="text-sm text-gray-500">
            サイドバーから配信者を追加してください
          </p>
        </div>
      ) : (
        <div className="grid-streamers">
          {favorites.map((favorite) => (
            <div
              key={favorite.id}
              className={showCards ? 'animate-card' : 'opacity-0'}
            >
              <DraggableStreamerCard
                favorite={favorite}
                onDelete={() => setStreamerToDelete(favorite)}
              />
            </div>
          ))}
        </div>
      )}

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
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: favorite.id,
    data: {
      streamer: favorite,
    },
  });

  // Twitchページを開く
  const handleTwitchClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://twitch.tv/${favorite.streamerLogin}`, '_blank');
  };

  // TODO: 配信者個別ページへのリンク（未実装）
  const handleStreamerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // 将来的に /streamers/[id] へ遷移
    console.log('Navigate to streamer page:', favorite.streamerId);
  };

  return (
    <div
      ref={setNodeRef}
      className={`relative ${isDragging ? 'opacity-10' : ''}`}
    >
      <div className="group bg-[#1a1a1a] hover:bg-[#222222] rounded-lg p-4 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10">
        {/* ドラッグハンドル（アイコン部分のみ） */}
        <div
          {...listeners}
          {...attributes}
          className="relative w-24 h-24 mx-auto mb-3 cursor-grab active:cursor-grabbing"
        >
          {/* ドラッグインジケーター（ホバー時表示） */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
            <div className="absolute inset-0 bg-black/30 rounded-full" />
            <GripVertical className="w-6 h-6 text-white drop-shadow-lg" />
          </div>

          {favorite.streamerImage ? (
            <Image
              src={favorite.streamerImage}
              alt={favorite.streamerName}
              fill
              className="rounded-full object-cover"
              sizes="96px"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-purple-600 flex items-center justify-center">
              <span className="text-2xl text-white font-bold">
                {favorite.streamerName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* 配信者名（クリックで個別ページへ - 未実装） */}
        <button
          onClick={handleStreamerClick}
          className="w-full text-center group/link hover:text-purple-400 transition-colors"
        >
          <p className="text-sm font-semibold text-gray-100 group-hover/link:text-purple-400 line-clamp-1 mb-1">
            {favorite.streamerName}
          </p>
          <p className="text-xs text-gray-400 group-hover/link:text-purple-300 line-clamp-1">
            @{favorite.streamerLogin}
          </p>
        </button>

        {/* アクションボタン（右上） */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
          {/* Twitchへリンク */}
          <button
            onClick={handleTwitchClick}
            className="p-1.5 bg-purple-600/80 hover:bg-purple-500 rounded-full transition-colors"
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
            className="p-1.5 bg-gray-800/80 hover:bg-red-900/80 rounded-full transition-colors"
            aria-label="お気に入りから削除"
          >
            <Trash2 className="w-3 h-3 text-gray-300 hover:text-red-400" />
          </button>
        </div>
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
      onClick={onView}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative bg-[#1a1a1a] rounded-lg p-4 transition-all duration-200 cursor-pointer
        ${isDragging
          ? 'ring-2 ring-blue-500 ring-opacity-50 animate-pulse'
          : 'hover:bg-[#222222] hover:scale-105 hover:shadow-lg hover:shadow-blue-500/10'
        }
        ${isOver ? 'bg-blue-500/20 ring-2 ring-blue-400 scale-105' : ''}
      `}
    >
      {/* アクションボタン（ホバー時表示） */}
      {isHovered && !isDragging && (
        <div className="absolute top-2 right-2 flex gap-1 z-10">
          <button
            onClick={handleEdit}
            className="p-1.5 bg-gray-800/80 hover:bg-gray-700 rounded transition-colors"
            aria-label="フォルダを編集"
          >
            <Edit2 className="w-3.5 h-3.5 text-gray-300 hover:text-gray-100" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 bg-gray-800/80 hover:bg-red-900/80 rounded transition-colors"
            aria-label="フォルダを削除"
          >
            <Trash2 className="w-3.5 h-3.5 text-gray-300 hover:text-red-400" />
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
      <p className="text-center text-sm font-semibold text-gray-100 line-clamp-1 mb-1">
        {folder.name}
      </p>
      <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
        <Users className="w-3 h-3" />
        <span>{streamerCount}人</span>
      </div>
    </div>
  );
}
