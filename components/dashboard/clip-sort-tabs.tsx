// 機能: クリップのソートタブとフォルダフィルター

'use client';

import Link from 'next/link';
import { TrendingUp, Calendar, Folder } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LABELS, ROUTES } from '@/lib/constants';
import type { Folder as FolderType } from '@/types/database';

export type SortType = 'views' | 'date-desc' | 'date-asc';

interface ClipSortTabsProps {
  sortType: SortType;
  onSortChange: (sortType: SortType) => void;
  clipCount: number;
  folders?: FolderType[];
  selectedFolderId?: string | null;
  onFolderClick?: (folderId: string | null) => void;
}

/**
 * クリップソートタブコンポーネント
 * ソート切り替えタブとフォルダフィルターを表示
 */
export function ClipSortTabs({
  sortType,
  onSortChange,
  clipCount,
  folders = [],
  selectedFolderId = null,
  onFolderClick,
}: ClipSortTabsProps) {
  // ソートタブの定義
  const tabs = [
    { value: 'views' as SortType, label: LABELS.SORT.VIEWS, icon: TrendingUp },
    { value: 'date-desc' as SortType, label: LABELS.SORT.DATE_DESC, icon: Calendar },
    { value: 'date-asc' as SortType, label: LABELS.SORT.DATE_ASC, icon: Calendar },
  ];

  return (
    <div className="space-y-3">
      {/* ソートタブ */}
      <div className="flex items-center gap-2 border-b border-[#e6e0d6] pb-3 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = sortType === tab.value;

          return (
            <Button
              key={tab.value}
              variant="ghost"
              size="sm"
              onClick={() => onSortChange(tab.value)}
              className={
                isActive
                  ? 'bg-[#e6e0d6] text-[#44403c] border-b-2 border-[#b8b0a6] rounded-none hover:bg-[#e6e0d6] hover:text-[#44403c]'
                  : 'text-[#b8b0a6] hover:text-[#6b655c] hover:bg-[#ebe5dc] rounded-none'
              }
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          );
        })}

        {/* お気に入り配信者リンク */}
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-[#c09080] hover:text-[#a06858] hover:bg-[#f5e8e4] rounded-none"
        >
          <Link href={ROUTES.FAVORITES}>
            <span className="mr-2">📁</span>
            お気に入り配信者
          </Link>
        </Button>

        {/* クリップ数バッジ */}
        {clipCount > 0 ? (
          <Badge
            variant="secondary"
            className="ml-auto bg-[#ebe5dc] text-[#6b655c] border border-[#e0d9cf]"
          >
            {clipCount} {LABELS.CLIPS.CLIP_UNIT}
          </Badge>
        ) : null}
      </div>

      {/* フォルダタグ */}
      {folders.length > 0 && onFolderClick ? (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-xs text-[#a09890] whitespace-nowrap">
            {LABELS.CLIPS.FOLDER_LABEL}
          </span>

          {/* フォルダタグ */}
          {folders.map((folder) => {
            const isSelected = selectedFolderId === folder.id;
            const streamerCount = folder.folderStreamers?.length || 0;

            return (
              <Button
                key={folder.id}
                variant="ghost"
                size="sm"
                onClick={() => onFolderClick(isSelected ? null : folder.id)}
                className={
                  isSelected
                    ? 'bg-[#e6e0d6] text-[#44403c] border border-[#d0c8bc] rounded-full px-3 py-1 h-auto text-xs hover:bg-[#e6e0d6] whitespace-nowrap'
                    : 'text-[#a09890] hover:text-[#6b655c] border border-[#e6e0d6] rounded-full px-3 py-1 h-auto text-xs hover:bg-[#ebe5dc] whitespace-nowrap'
                }
              >
                <Folder className="w-3 h-3 mr-1" />
                {folder.name}
                {streamerCount > 0 ? (
                  <span className="ml-1 text-[10px] opacity-70">
                    ({streamerCount})
                  </span>
                ) : null}
              </Button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
