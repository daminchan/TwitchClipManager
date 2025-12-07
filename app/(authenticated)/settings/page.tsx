// 適用スキル: page-creator
// 適用ルール:
// - セクション3: ディレクトリ構造
// - セクション10.2: サーバー/クライアントコンポーネント分離
// - Next.js App Router ベストプラクティス
// - YouTube風レイアウト: コンテンツのみを返す

import { auth } from '@/lib/auth';
import { SettingsContent } from '@/components/settings/settings-content';

/**
 * 設定ページ（認証済みユーザー専用）
 *
 * レイアウトで認証チェック済み
 * このページはコンテンツのみを返す
 */
export default async function SettingsPage() {
  const session = await auth();

  return (
    <SettingsContent
      userEmail={session!.user!.email!}
      userName={session!.user!.name || ''}
    />
  );
}
