// 適用スキル: page-creator
// 適用ルール:
// - セクション3: ディレクトリ構造
// - セクション10.2: サーバー/クライアントコンポーネント分離
// - Next.js App Router ベストプラクティス

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { SettingsContent } from '@/components/settings/settings-content';
import { ROUTES } from '@/lib/constants';

/**
 * 設定ページ（サーバーコンポーネント）
 *
 * サーバー側で:
 * - 認証チェック
 * - ユーザー情報の取得
 *
 * クライアント側(SettingsContent)で:
 * - インタラクティブなUI
 * - サーバーアクション呼び出し
 * - 状態管理
 */
export default async function SettingsPage() {
  // サーバー側で認証チェック
  const session = await auth();

  // 未認証の場合はログインページにリダイレクト
  if (!session?.user) {
    redirect(ROUTES.LOGIN);
  }

  // 認証済みユーザーの情報をクライアントコンポーネントに渡す
  return (
    <SettingsContent
      userEmail={session.user.email!}
      userName={session.user.name || ''}
    />
  );
}
