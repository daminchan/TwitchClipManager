// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション8.2: Props型定義

'use client';

import { TrendingUp, Calendar, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LABELS } from '@/lib/constants';

export type SortType = 'all' | 'views' | 'date-desc' | 'date-asc';

interface ClipSortTabsProps {
  sortType: SortType;
  onSortChange: (sortType: SortType) => void;
  clipCount: number;
}

export function ClipSortTabs({ sortType, onSortChange, clipCount }: ClipSortTabsProps) {
  const tabs = [
    { value: 'all' as SortType, label: LABELS.SORT.ALL, icon: Sparkles },
    { value: 'views' as SortType, label: LABELS.SORT.VIEWS, icon: TrendingUp },
    { value: 'date-desc' as SortType, label: LABELS.SORT.DATE_DESC, icon: Calendar },
    { value: 'date-asc' as SortType, label: LABELS.SORT.DATE_ASC, icon: Calendar },
  ];

  return (
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
  );
}
