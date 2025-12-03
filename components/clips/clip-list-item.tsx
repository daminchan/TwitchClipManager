// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション8.2: Props型定義

'use client';

import Image from 'next/image';
import { MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TwitchClip } from '@/types/twitch';

interface ClipListItemProps {
  clip: TwitchClip;
  onDelete: (clipId: string) => void;
  onSelectClip?: (clipId: string) => void;
  isDeleting?: boolean;
  isSelected?: boolean;
}

export function ClipListItem({ clip, onDelete, onSelectClip, isDeleting, isSelected }: ClipListItemProps) {
  // 視聴回数をフォーマット
  const formatViewCount = (count: number): string => {
    if (count >= 10000) {
      return `${(count / 10000).toFixed(1)}万回視聴`;
    }
    return `${count.toLocaleString()}回視聴`;
  };

  // 日付をフォーマット
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '今日';
    if (diffDays === 1) return '昨日';
    if (diffDays < 7) return `${diffDays}日前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}か月前`;
    return `${Math.floor(diffDays / 365)}年前`;
  };

  const handleClick = () => {
    if (onSelectClip) {
      onSelectClip(clip.id);
    }
  };

  return (
    <div
      className={`flex gap-4 p-2 rounded-lg transition-colors group cursor-pointer ${
        isSelected
          ? 'bg-gray-800 border-2 border-purple-600'
          : 'hover:bg-gray-900 border-2 border-transparent'
      }`}
      onClick={handleClick}
    >
      {/* サムネイル（左側） */}
      <div className="relative flex-shrink-0">
        <Image
          src={clip.thumbnail_url}
          alt={clip.title}
          width={246}
          height={138}
          className="rounded-lg object-cover"
        />
        <div className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 rounded">
          {Math.floor(clip.duration)}s
        </div>
      </div>

      {/* 情報（右側） */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-100 line-clamp-2 mb-1">
          {clip.title}
        </h3>
        <p className="text-xs text-gray-400 mb-1">{clip.broadcaster_name}</p>
        <div className="text-xs text-gray-500">
          {formatViewCount(clip.view_count)} • {formatDate(clip.created_at)}
        </div>
      </div>

      {/* 3点メニュー */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-100"
              disabled={isDeleting}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#282828] border-gray-700">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete(clip.id);
              }}
              className="text-gray-100 hover:bg-gray-700 cursor-pointer"
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? '削除中...' : 'お気に入りから削除'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
