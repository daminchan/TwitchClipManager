// 適用スキル: page-creator
// 適用ルール:
// - セクション3: ディレクトリ構造
// - セクション10.2: サーバー/クライアントコンポーネント分離
// - Next.js App Router ベストプラクティス
// - YouTube風レイアウト: コンテンツのみを返す

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DashboardContent } from '@/components/dashboard/dashboard-content';

/**
 * ダッシュボードページ（ルートページ）
 *
 * 未認証ユーザーもアクセス可能
 * 未認証の場合はオンボーディングモーダルを表示
 */
export default async function DashboardPage() {
  const session = await auth();

  // 未認証の場合
  if (!session?.user) {
    return (
      <DashboardContent
        userId={null}
        userEmail={null}
        isAuthenticated={false}
        skipAuth={false}
      />
    );
  }

  // お気に入り配信者の数を取得
  const favoriteCount = await prisma.favoriteStreamer.count({
    where: { userId: session.user.id },
  });

  const skipAuth = favoriteCount === 0;

  return (
    <DashboardContent
      userId={session.user.id!}
      userEmail={session.user.email!}
      isAuthenticated={true}
      skipAuth={skipAuth}
    />
  );
}
