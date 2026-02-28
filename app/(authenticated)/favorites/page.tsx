// 適用スキル: page-creator
// 適用ルール:
// - セクション3: ディレクトリ構造
// - セクション10.2: サーバー/クライアントコンポーネント分離
// - Next.js App Router ベストプラクティス
// - YouTube風レイアウト: コンテンツのみを返す

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { FavoritesContent } from '@/components/favorites/favorites-content';
import { ROUTES } from '@/lib/constants';

/**
 * お気に入り配信者ページ（認証済みユーザー専用）
 *
 * 未認証の場合はホームにリダイレクト
 */
export default async function FavoritesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect(ROUTES.LOGIN);
  }

  return <FavoritesContent />;
}
