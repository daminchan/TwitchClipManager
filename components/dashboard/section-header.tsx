// 機能: セクション見出し（タイトル + アイコン + オプションのアクション）

'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  icon: LucideIcon;
  action?: ReactNode;
}

export function SectionHeader({ title, icon: Icon, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-5 h-5 text-purple-400" />
      <h2 className="text-lg font-bold text-gray-100">{title}</h2>
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}
