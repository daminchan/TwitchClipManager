// 機能: セクション見出し（タイトル + アイコン + 色付き座布団 + オプションのアクション）

'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  icon: LucideIcon;
  action?: ReactNode;
  pillBg?: string;
  iconColor?: string;
  textColor?: string;
}

export function SectionHeader({
  title,
  icon: Icon,
  action,
  pillBg = 'bg-[#ebe5dc]',
  iconColor = 'text-[#a09890]',
  textColor = 'text-[#5a524a]',
}: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className={`inline-flex items-center gap-2 ${pillBg} rounded-full px-4 py-1.5`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
        <h2 className={`text-lg font-bold ${textColor}`}>{title}</h2>
      </div>
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}
