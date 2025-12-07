// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション8.2: Props型定義

'use client';

import { TrendingUp, Calendar, Sparkles, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LABELS } from '@/lib/constants';
import type { Folder as FolderType } from '@/types/database';

export type SortType = 'all' | 'views' | 'date-desc' | 'date-asc';

interface ClipSortTabsProps {
  sortType: SortType;
  onSortChange: (sortType: SortType) => void;
  clipCount: number;
  folders?: FolderType[];
  selectedFolderId?: string | null;
  onFolderClick?: (folderId: string | null) => void;
}

export function ClipSortTabs({
  sortType,
  onSortChange,
  clipCount,
  folders = [],
  selectedFolderId = null,
  onFolderClick
}: ClipSortTabsProps) {
  const tabs = [
    { value: 'all' as SortType, label: LABELS.SORT.ALL, icon: Sparkles },
    { value: 'views' as SortType, label: LABELS.SORT.VIEWS, icon: TrendingUp },
    { value: 'date-desc' as SortType, label: LABELS.SORT.DATE_DESC, icon: Calendar },
    { value: 'date-asc' as SortType, label: LABELS.SORT.DATE_ASC, icon: Calendar },
  ];

  return (
    <div className="space-y-3">
      {/* ソートタブ */}
      <div className="flex items-center gap-2 border-b border-[#2a2a2a] pb-3 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = sortType === tab.value;

          return (
            <Button
              key={tab.value}
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onSortChange(tab.value)}
              className={
                isActive
                  ? 'bg-gray-800 text-white border-b-2 border-purple-500 rounded-none'
                  : 'text-gray-400 hover:text-gray-200 rounded-none'
              }
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          );
        })}
        {clipCount > 0 && (
          <Badge variant="secondary" className="ml-auto bg-purple-600/20 text-purple-300 border-purple-500/30">
            {clipCount} クリップ
          </Badge>
        )}
      </div>

      {/* フォルダタグ */}
      {folders.length > 0 && onFolderClick && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-xs text-gray-500 whitespace-nowrap">フォルダ:</span>

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
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/50 rounded-full px-3 py-1 h-auto text-xs hover:bg-purple-600/30 whitespace-nowrap'
                    : 'text-gray-400 hover:text-gray-200 border border-gray-700 rounded-full px-3 py-1 h-auto text-xs hover:bg-[#1a1a1a] whitespace-nowrap'
                }
              >
                <Folder className="w-3 h-3 mr-1" />
                {folder.name}
                {streamerCount > 0 && (
                  <span className="ml-1 text-[10px] opacity-70">({streamerCount})</span>
                )}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
