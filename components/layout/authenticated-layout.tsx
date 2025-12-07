// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション10.2: サーバー/クライアントコンポーネント分離
// - YouTube風永続レイアウト

'use client';

import { useState, createContext, useContext } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { Toast } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { useFavoriteActions } from '@/hooks/use-favorite-actions';

import type { TwitchChannel } from '@/types/twitch';

// フォルダ選択状態を共有するためのContext
interface FolderContextType {
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
}

const FolderContext = createContext<FolderContextType | undefined>(undefined);

export function useFolderContext() {
  const context = useContext(FolderContext);
  if (!context) {
    throw new Error('useFolderContext must be used within AuthenticatedLayout');
  }
  return context;
}

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const queryClient = useQueryClient();
  const { toast, showToast, hideToast } = useToast();
  const { handleAddFavorite: addFavorite } = useFavoriteActions();

  // サイドバー制御
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // フォルダ選択状態
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // お気に入り配信者を追加
  const handleAddFavorite = async (streamer: TwitchChannel) => {
    await addFavorite(
      streamer,
      (message) => showToast(message, 'success'),
      (message, type) => showToast(message, type)
    );
  };

  // お気に入り配信者を削除したときのハンドラー
  const handleRemoveFavorite = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['clips', 'favorites'],
      refetchType: 'active'
    });
    await queryClient.invalidateQueries({ queryKey: ['favorites'] });
  };

  // フォルダクリック時のハンドラー
  const handleFolderClick = (folderId: string) => {
    if (selectedFolderId === folderId) {
      // 同じフォルダをクリック → 解除（全クリップ表示に戻す）
      setSelectedFolderId(null);
    } else {
      setSelectedFolderId(folderId);
    }
  };

  return (
    <FolderContext.Provider value={{ selectedFolderId, setSelectedFolderId }}>
      <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
        {/* 固定ヘッダー */}
        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="flex flex-1 overflow-hidden">
          {/* 固定サイドバー */}
          <DashboardSidebar
            isSidebarOpen={isSidebarOpen}
            onAddFavorite={handleAddFavorite}
            onRemoveFavorite={handleRemoveFavorite}
            selectedFolderId={selectedFolderId}
            onFolderClick={handleFolderClick}
          />

          {/* メインコンテンツ（ページごとに切り替わる） */}
          <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#0f0f0f] to-[#1a1a1a]">
            {children}
          </main>
        </div>

        {/* モバイルフッターナビゲーション */}
        <MobileNav />

        {/* トースト通知 */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
          />
        )}
      </div>
    </FolderContext.Provider>
  );
}
