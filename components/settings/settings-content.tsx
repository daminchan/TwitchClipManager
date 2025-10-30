// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション10.2: サーバー/クライアントコンポーネント分離

'use client';

import { useState } from 'react';

import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { Toast } from '@/components/ui/toast';

import { DisplayNameSection } from '@/components/settings/display-name-section';
import { AccountInfoSection } from '@/components/settings/account-info-section';
import { DangerZoneSection } from '@/components/settings/danger-zone-section';

interface SettingsContentProps {
  userEmail: string;
  userName: string;
}

export function SettingsContent({ userEmail, userName }: SettingsContentProps) {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const handleSuccess = (message: string) => {
    setToast({ message, type: 'success' });
  };

  const handleError = (message: string) => {
    setToast({ message, type: 'error' });
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 pb-24 lg:pb-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-100 mb-8">設定</h1>

        <div className="space-y-6">
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

          {/* アカウント削除 */}
          <DangerZoneSection
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </div>
      </main>

      {/* モバイルフッターナビゲーション */}
      <MobileNav />

      {/* トースト通知 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
