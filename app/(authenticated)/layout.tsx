// 適用スキル: component-creator
// 適用ルール:
// - Next.js App Router ベストプラクティス
// - YouTube風永続レイアウト（ヘッダー・サイドバー固定）
// - ページ遷移時はコンテンツのみ更新
// - 未認証ユーザーもアクセス可能（オンボーディングモーダル表示）

import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

export default function Layout({ children }: { children: React.ReactNode }) {
  // 認証チェックなし - 未認証ユーザーもアクセス可能
  // オンボーディングモーダルで認証を促す
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
