// 適用スキル: component-creator
// 適用ルール:
// - セクション4.1: ファイル命名規則（kebab-case: header.tsx）
// - セクション4.2: コンポーネント命名規則（PascalCase: Header）
// - セクション4.5: インポート順序
// - セクション4.6: コンポーネント構造

'use client';

import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { Settings, Search, Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ClipSortTabs } from '@/components/dashboard/clip-sort-tabs';
import type { SortType } from '@/components/dashboard/clip-sort-tabs';
import { APP_CONFIG, ROUTES, LABELS } from '@/lib/constants';

interface HeaderProps {
  onToggleSidebar?: () => void;
  // ダッシュボード用の検索・ソート機能
  showDashboardControls?: boolean;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  sortType?: SortType;
  setSortType?: (type: SortType) => void;
  clipCount?: number;
}

export function Header({
  onToggleSidebar,
  showDashboardControls = false,
  searchQuery = '',
  setSearchQuery,
  sortType = 'date-desc',
  setSortType,
  clipCount = 0,
}: HeaderProps) {
  const { data: session } = useSession();
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const handleMobileSearch = () => {
    setShowMobileSearch(!showMobileSearch);
    if (!showMobileSearch) {
      const event = new CustomEvent('openMobileSearch');
      window.dispatchEvent(event);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#2a2a2a] bg-[#0f0f0f]/95 backdrop-blur">
      <div className="flex flex-col">
        {/* トップバー */}
        <div className={`flex h-16 items-center px-4 md:px-6 w-full gap-4 ${showDashboardControls ? '' : 'justify-between'}`}>
        {/* 左側: ハンバーガー + タイトル */}
        <div className="flex items-center gap-3">
          {/* ハンバーガーメニュー（デスクトップのみ） */}
          {onToggleSidebar && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSidebar}
              className="hidden lg:flex p-2 hover:bg-[#1a1a1a]"
              aria-label="サイドバーを切り替え"
            >
              <Menu className="w-6 h-6 text-gray-100" />
            </Button>
          )}

          <Link href="/" className="flex items-center flex-shrink-0">
            <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              {APP_CONFIG.name}
            </div>
          </Link>
        </div>

        {/* 中央: ダッシュボード用検索バー（デスクトップのみ） */}
        {showDashboardControls && setSearchQuery && (
          <div className="hidden lg:flex relative flex-1 max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder={LABELS.PLACEHOLDERS.SEARCH_CLIPS}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1a1a1a] border-0 text-gray-100 placeholder-gray-400 w-full"
            />
          </div>
        )}

        {/* 右側: ユーザー情報 */}

        {session?.user && (
          <div className="flex items-center gap-2 md:gap-3">
            {/* モバイル専用ボタン */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleMobileSearch}
              className="lg:hidden bg-[#1a1a1a] border-0 text-gray-100 hover:bg-[#222222] p-2"
              aria-label="検索"
            >
              <Search className="w-5 h-5" />
            </Button>

            {/* デスクトップ表示 */}
            <div className="hidden md:flex items-center gap-2">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-purple-600 text-white text-sm">
                  {session.user.name?.[0]?.toUpperCase() || session.user.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-gray-100">
                {session.user.name || session.user.email}
              </span>
            </div>
            <Link href={ROUTES.SETTINGS} className="hidden md:block">
              <Button
                variant="outline"
                size="sm"
                className="text-xs md:text-sm bg-[#1a1a1a] border-0 text-gray-100 hover:bg-[#222222]"
              >
                <Settings className="w-4 h-4 md:mr-1" />
                <span className="hidden md:inline">設定</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="hidden md:flex text-xs md:text-sm bg-[#1a1a1a] border-0 text-gray-100 hover:bg-[#222222] hover:border-purple-500"
            >
              ログアウト
            </Button>
          </div>
        )}
        </div>

        {/* ダッシュボード用のソートタブ */}
        {showDashboardControls && setSortType && (
          <div className="px-4 md:px-6 py-3 border-t border-[#2a2a2a]">
            <ClipSortTabs
              sortType={sortType}
              onSortChange={setSortType}
              clipCount={clipCount}
            />
          </div>
        )}
      </div>
    </header>
  );
}
