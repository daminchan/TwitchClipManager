// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション10.2: サーバー/クライアントコンポーネント分離

'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { Toast } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { useFavoriteActions } from '@/hooks/use-favorite-actions';

import { DisplayNameSection } from '@/components/settings/display-name-section';
import { AccountInfoSection } from '@/components/settings/account-info-section';
import { DangerZoneSection } from '@/components/settings/danger-zone-section';

import type { TwitchChannel } from '@/types/twitch';

interface SettingsContentProps {
  userEmail: string;
  userName: string;
}

export function SettingsContent({ userEmail, userName }: SettingsContentProps) {
  const queryClient = useQueryClient();
  const { toast, showToast, hideToast } = useToast();
  const { handleAddFavorite: addFavorite } = useFavoriteActions();

  // サイドバー制御
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleSuccess = (message: string) => {
    showToast(message, 'success');
  };

  const handleError = (message: string) => {
    showToast(message, 'error');
  };

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
    await queryClient.invalidateQueries({ queryKey: ['favorites'] });
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        {/* 左サイドバー */}
        <DashboardSidebar
          isSidebarOpen={isSidebarOpen}
          onAddFavorite={handleAddFavorite}
          onRemoveFavorite={handleRemoveFavorite}
        />

        {/* メインコンテンツ */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#0f0f0f] to-[#1a1a1a]">
          <div className="container mx-auto px-4 py-8 pb-24 lg:pb-8 max-w-3xl">
            {/* ヘッダーセクション */}
            <div className="mb-10">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                設定
              </h1>
              <p className="text-gray-400 text-sm">
                アカウント情報の確認と設定の変更
              </p>
              <div className="mt-4 h-1 w-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
            </div>

            <div className="space-y-8">
              {/* 表示名変更 */}
              <DisplayNameSection
                currentName={userName}
                onSuccess={handleSuccess}
                onError={handleError}
              />

              {/* アカウント情報 */}
              <AccountInfoSection
                email={userEmail}
                name={userName}
              />

              {/* 区切り線 */}
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-800"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[#1a1a1a] px-4 text-xs text-gray-500 uppercase tracking-wider">
                    危険な操作
                  </span>
                </div>
              </div>

              {/* アカウント削除 */}
              <DangerZoneSection
                onSuccess={handleSuccess}
                onError={handleError}
              />
            </div>
          </div>
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
  );
}
