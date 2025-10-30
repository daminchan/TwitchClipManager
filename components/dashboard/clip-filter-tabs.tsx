// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション8: 定数管理

'use client';

import { CLIP_FILTERS, ClipFilterType } from '@/lib/constants';

interface ClipFilterTabsProps {
  currentFilter: ClipFilterType;
  onFilterChange: (filter: ClipFilterType) => void;
  clipCount: number;
}

export function ClipFilterTabs({
  currentFilter,
  onFilterChange,
  clipCount,
}: ClipFilterTabsProps) {
  const filters: ClipFilterType[] = ['WEEK', 'THREE_DAYS', 'MONTH'];

  return (
    <div className="space-y-3">
      {/* フィルタータブ */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filters.map((filter) => {
          const config = CLIP_FILTERS[filter];
          const isActive = currentFilter === filter;

          return (
            <button
              key={filter}
              onClick={() => onFilterChange(filter)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-lg
                font-medium text-sm whitespace-nowrap transition-all
                ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#252525] hover:text-gray-200'
                }
              `}
            >
              <span className="text-lg">{config.icon}</span>
              <span>{config.label}</span>
            </button>
          );
        })}
      </div>

      {/* フィルター説明とクリップ件数 */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-gray-400">{CLIP_FILTERS[currentFilter].description}</p>
        <p className="text-gray-500">
          {clipCount}件のクリップ
        </p>
      </div>
    </div>
  );
}
