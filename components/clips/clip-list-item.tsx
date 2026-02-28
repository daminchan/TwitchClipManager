'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { MoreVertical, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMounted } from '@/hooks/use-is-mounted';
import type { TwitchClip } from '@/types/twitch';

interface ClipListItemProps {
  clip: TwitchClip;
  onDelete: (clipId: string) => void;
  onSelectClip?: (clipId: string) => void;
  isDeleting?: boolean;
  isSelected?: boolean;
}

function formatRelativeDate(dateString: string): string {
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
}

function formatViewCount(count: number): string {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万回視聴`;
  }
  return `${count.toLocaleString()}回視聴`;
}

export function ClipListItem({ clip, onDelete, onSelectClip, isDeleting, isSelected }: ClipListItemProps) {
  const isMounted = useIsMounted();

  const relativeDate = useMemo(
    () => (isMounted ? formatRelativeDate(clip.created_at) : ''),
    [isMounted, clip.created_at]
  );

  return (
    <div
      className={`flex gap-3 lg:gap-4 p-2 rounded-lg transition-all duration-300 group ${
        isDeleting
          ? 'opacity-50 pointer-events-none bg-gray-900/50'
          : isSelected
            ? 'bg-gray-800 border-2 border-purple-600 cursor-pointer'
            : 'hover:bg-gray-900 border-2 border-transparent cursor-pointer'
      }`}
      onClick={isDeleting ? undefined : () => onSelectClip?.(clip.id)}
    >
      {/* サムネイル（左側） - モバイルで小さく、PCで大きく */}
      <div className="relative flex-shrink-0">
        <Image
          src={clip.thumbnail_url}
          alt={clip.title}
          width={246}
          height={138}
          className={`rounded-lg object-cover w-[160px] h-[90px] lg:w-[246px] lg:h-[138px] transition-all duration-300 ${
            isDeleting ? 'grayscale' : ''
          }`}
        />
        <div className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 rounded">
          {Math.floor(clip.duration)}s
        </div>
        {/* 削除中オーバーレイ */}
        {isDeleting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* 情報（右側） */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1">
          <h3 className={`text-sm font-medium line-clamp-2 flex-1 ${
            isDeleting ? 'text-gray-500' : 'text-gray-100'
          }`}>
            {clip.title}
          </h3>
          {/* 削除中バッジ */}
          {isDeleting && (
            <Badge variant="secondary" className="bg-red-600/20 text-red-400 border-red-600/50 flex-shrink-0 text-xs">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              削除中
            </Badge>
          )}
        </div>
        <p className={`text-xs mb-1 ${isDeleting ? 'text-gray-600' : 'text-gray-400'}`}>
          {clip.broadcaster_name}
        </p>
        <div className={`text-xs ${isDeleting ? 'text-gray-600' : 'text-gray-500'}`}>
          {formatViewCount(clip.view_count)} • {relativeDate}
        </div>
      </div>

      {/* 3点メニュー - モバイルで常に表示、PCでホバー時表示 */}
      <div className={`flex-shrink-0 transition-opacity ${
        isDeleting ? 'opacity-30' : 'lg:opacity-0 lg:group-hover:opacity-100'
      }`}>
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
