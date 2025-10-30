// 適用スキル: page-creator
// 適用ルール:
// - セクション3: ディレクトリ構造
// - セクション10.2: サーバー/クライアントコンポーネント分離
// - Next.js App Router ベストプラクティス

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { ROUTES, LABELS } from '@/lib/constants';

/**
 * ダッシュボードページ（サーバーコンポーネント）
 *
 * サーバー側で:
 * - 認証チェック
 * - ユーザー情報の取得
 *
 * クライアント側(DashboardContent)で:
 * - インタラクティブなUI
 * - データフェッチ
 * - 状態管理
 */
export default async function DashboardPage() {
  // サーバー側で認証チェック
  const session = await auth();

  // 未認証の場合はログインページにリダイレクト
  if (!session?.user) {
    redirect(ROUTES.LOGIN);
  }

  // 認証済みユーザーの情報をクライアントコンポーネントに渡す
  return (
    <DashboardContent
      userId={session.user.id!}
      userEmail={session.user.email!}
    />
  );
}
