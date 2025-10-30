// 適用スキル: page-creator
// 適用ルール:
// - セクション3: ディレクトリ構造
// - セクション10.2: サーバー/クライアントコンポーネント分離
// - Next.js App Router ベストプラクティス

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { FavoritesClipsContent } from '@/components/favorites-clips/favorites-clips-content';
import { ROUTES } from '@/lib/constants';

/**
 * お気に入りクリップページ（サーバーコンポーネント）
 *
 * サーバー側で:
 * - 認証チェック
 *
 * クライアント側(FavoritesClipsContent)で:
 * - インタラクティブなUI
 * - いいねクリップの取得と表示
 * - いいね解除処理
 */
export default async function FavoritesClipsPage() {
  // サーバー側で認証チェック
  const session = await auth();

  // 未認証の場合はログインページにリダイレクト
  if (!session?.user) {
    redirect(ROUTES.LOGIN);
  }

  // 認証済みユーザーにはクライアントコンポーネントを表示
  return <FavoritesClipsContent />;
}
