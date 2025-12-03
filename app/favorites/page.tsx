// 適用スキル: page-creator
// 適用ルール:
// - セクション3: ディレクトリ構造
// - セクション10.2: サーバー/クライアントコンポーネント分離
// - Next.js App Router ベストプラクティス

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { FavoritesContent } from '@/components/favorites/favorites-content';
import { ROUTES } from '@/lib/constants';

/**
 * お気に入り配信者ページ（サーバーコンポーネント）
 *
 * サーバー側で:
 * - 認証チェック
 *
 * クライアント側(FavoritesContent)で:
 * - インタラクティブなUI
 * - お気に入り配信者の表示
 * - 配信者追加・削除処理
 */
export default async function FavoritesPage() {
  // サーバー側で認証チェック
  const session = await auth();

  // 未認証の場合はログインページにリダイレクト
  if (!session?.user) {
    redirect(ROUTES.LOGIN);
  }

  // 認証済みユーザーにはクライアントコンポーネントを表示
  return <FavoritesContent />;
}
