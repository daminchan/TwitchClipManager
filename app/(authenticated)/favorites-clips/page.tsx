// 適用スキル: page-creator
// 適用ルール:
// - セクション3: ディレクトリ構造
// - セクション10.2: サーバー/クライアントコンポーネント分離
// - Next.js App Router ベストプラクティス
// - YouTube風レイアウト: コンテンツのみを返す

import { FavoritesClipsContent } from '@/components/favorites-clips/favorites-clips-content';

/**
 * お気に入りクリップページ（認証済みユーザー専用）
 *
 * レイアウトで認証チェック済み
 * このページはコンテンツのみを返す
 */
export default function FavoritesClipsPage() {
  return <FavoritesClipsContent />;
}
