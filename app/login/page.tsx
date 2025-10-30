// 適用スキル: page-creator
// 適用ルール:
// - セクション3: ディレクトリ構造
// - セクション10.2: サーバー/クライアントコンポーネント分離
// - Next.js App Router ベストプラクティス

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { LoginForm } from '@/components/auth/login-form';
import { ROUTES } from '@/lib/constants';

/**
 * ログインページ（サーバーコンポーネント）
 *
 * サーバー側で:
 * - 認証済みかチェック
 * - 認証済みならダッシュボードへリダイレクト
 *
 * クライアント側(LoginForm)で:
 * - ログイン/サインアップフォーム
 * - バリデーション
 * - 認証処理
 */
export default async function LoginPage() {
  // サーバー側で認証チェック
  const session = await auth();

  // すでにログイン済みの場合はダッシュボードへ
  if (session?.user) {
    redirect(ROUTES.DASHBOARD);
  }

  // 未認証ユーザーにはログインフォームを表示
  return <LoginForm />;
}
