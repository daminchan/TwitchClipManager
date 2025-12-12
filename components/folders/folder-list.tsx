// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション8.2: Props型定義

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Folder as FolderIcon, MoreVertical, Edit2, Trash2, Users } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { getFolders } from '@/actions/folders';
import type { Folder } from '@/types/database';

interface FolderListProps {
  isDragging?: boolean;
  selectedFolderId?: string | null;
  onFolderClick?: (folderId: string) => void;
  onFolderEdit?: (folder: Folder) => void;
  onFolderDelete?: (folder: Folder) => void;
  onViewStreamers?: (folder: Folder) => void;
}

export function FolderList({ isDragging = false, selectedFolderId, onFolderClick, onFolderEdit, onFolderDelete, onViewStreamers }: FolderListProps) {
  // フォルダ一覧を取得
  const { data: result, isLoading } = useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      const response = await getFolders();
      return response;
    },
  });

  const folders: Folder[] = result?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-8 bg-gray-700 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (folders.length === 0) {
    return (
      <p className="text-xs text-gray-500 text-center py-2">
        フォルダを作成してください
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {folders.map((folder) => (
        <FolderItem
          key={folder.id}
          folder={folder}
          isDragging={isDragging}
          isSelected={selectedFolderId === folder.id}
          onFolderClick={onFolderClick}
          onFolderEdit={onFolderEdit}
          onFolderDelete={onFolderDelete}
          onViewStreamers={onViewStreamers}
        />
      ))}
    </div>
  );
}

interface FolderItemProps {
  folder: Folder;
  isDragging: boolean;
  isSelected: boolean;
  onFolderClick?: (folderId: string) => void;
  onFolderEdit?: (folder: Folder) => void;
  onFolderDelete?: (folder: Folder) => void;
  onViewStreamers?: (folder: Folder) => void;
}

function FolderItem({ folder, isDragging, isSelected, onFolderClick, onFolderEdit, onFolderDelete, onViewStreamers }: FolderItemProps) {
  const [showMenu, setShowMenu] = useState(false);

  // 作成中フォルダ（temp-で始まるID）はD&D不可
  const isPending = folder.id.startsWith('temp-');

  const { setNodeRef, isOver } = useDroppable({
    id: folder.id,
    data: {
      type: 'folder',
      folder,
    },
    disabled: isPending, // 作成中はドロップ不可
  });

  const handleClick = () => {
    if (!isDragging && !isPending && onFolderClick) {
      onFolderClick(folder.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onFolderEdit) {
      onFolderEdit(folder);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onFolderDelete) {
      onFolderDelete(folder);
    }
  };

  const handleViewStreamers = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewStreamers) {
      onViewStreamers(folder);
    }
  };

  return (
    <div
      ref={setNodeRef}
      onClick={handleClick}
      onMouseEnter={() => setShowMenu(true)}
      onMouseLeave={() => setShowMenu(false)}
      className={`
        group relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200
        ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${isSelected && !isPending ? 'bg-purple-600/20 ring-1 ring-purple-500' : ''}
        ${isDragging && !isPending
          ? 'ring-2 ring-blue-500 ring-opacity-50 animate-pulse'
          : !isPending ? 'hover:bg-[#2a2a2a]' : ''
        }
        ${isOver && !isPending ? 'bg-[#2a2a2a] ring-2 ring-blue-400' : ''}
      `}
    >
      {/* 作成中インジケーター */}
      {isPending ? (
        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
      ) : (
        <FolderIcon
          className="w-4 h-4 flex-shrink-0"
          style={{ color: folder.color }}
        />
      )}
      <span className="text-sm text-gray-300 truncate flex-1">
        {folder.name}
      </span>

      {/* 配信者数（クリック可能、ホバー時アイコンのみ、作成中は非表示） */}
      {!isPending && (
        <button
          onClick={handleViewStreamers}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-400 px-2 py-1 rounded hover:bg-blue-500/10 transition-all button-press-feedback"
          aria-label="配信者を表示"
        >
          <Users className="w-3 h-3 flex-shrink-0" />
          <span className={`${showMenu ? 'hidden' : 'block'}`}>
            {folder.folderStreamers?.length || 0}
          </span>
        </button>
      )}

      {/* アクションボタン（ホバー時表示、作成中は非表示） */}
      {showMenu && !isDragging && !isPending && (
        <div className="flex items-center gap-1">
          <button
            onClick={handleEdit}
            className="p-1 hover:bg-[#3a3a3a] rounded transition-colors button-press-feedback"
            aria-label="フォルダを編集"
          >
            <Edit2 className="w-3 h-3 text-gray-400 hover:text-gray-100" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 hover:bg-red-900/30 rounded transition-colors button-press-feedback"
            aria-label="フォルダを削除"
          >
            <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-400" />
          </button>
        </div>
      )}
    </div>
  );
}
