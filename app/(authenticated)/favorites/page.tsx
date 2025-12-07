// 適用スキル: page-creator
// 適用ルール:
// - セクション3: ディレクトリ構造
// - セクション10.2: サーバー/クライアントコンポーネント分離
// - Next.js App Router ベストプラクティス
// - YouTube風レイアウト: コンテンツのみを返す

import { FavoritesContent } from '@/components/favorites/favorites-content';

/**
 * お気に入り配信者ページ（認証済みユーザー専用）
 *
 * レイアウトで認証チェック済み
 * このページはコンテンツのみを返す
 */
export default function FavoritesPage() {
  return <FavoritesContent />;
}
