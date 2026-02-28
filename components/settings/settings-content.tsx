// - YouTube風レイアウト: コンテンツのみ

'use client';

import { Toast } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';

import { DisplayNameSection } from '@/components/settings/display-name-section';
import { AccountInfoSection } from '@/components/settings/account-info-section';
import { DangerZoneSection } from '@/components/settings/danger-zone-section';

interface SettingsContentProps {
  userEmail: string;
  userName: string;
}

export function SettingsContent({ userEmail, userName }: SettingsContentProps) {
  const { toast, showToast, hideToast } = useToast();

  const handleSuccess = (message: string) => {
    showToast(message, 'success');
  };

  const handleError = (message: string) => {
    showToast(message, 'error');
  };

  return (
    <div className="page-container">
      {/* ヘッダーセクション */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          設定
        </h1>
        <p className="text-gray-500 text-sm">
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
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-4 text-xs text-gray-500 uppercase tracking-wider">
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
