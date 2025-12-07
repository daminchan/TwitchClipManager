// 適用スキル: component-creator
// 適用ルール:
// - Next.js App Router ベストプラクティス
// - YouTube風永続レイアウト（ヘッダー・サイドバー固定）
// - ページ遷移時はコンテンツのみ更新

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ROUTES } from '@/lib/constants';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

export default async function Layout({ children }: { children: React.ReactNode }) {
  // サーバー側で認証チェック
  const session = await auth();

  if (!session?.user) {
    redirect(ROUTES.LOGIN);
  }

  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
