// 適用スキル: page-creator
// 適用ルール:
// - セクション3: ディレクトリ構造
// - セクション10.2: サーバー/クライアントコンポーネント分離
// - Next.js App Router ベストプラクティス
// - オンボーディングフロー設計.md: ルーティング変更

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { ROUTES } from '@/lib/constants';

/**
 * ルートページ（旧ダッシュボード）
 *
 * サーバー側で:
 * - 認証チェック（未ログインならオンボーディングモーダル表示）
 * - 新規ユーザー判定（お気に入り配信者の有無）
 * - ユーザー情報の取得
 *
 * クライアント側(DashboardContent)で:
 * - オンボーディングモーダル表示制御
 * - インタラクティブなUI
 * - データフェッチ
 * - 状態管理
 */
export default async function HomePage() {
  // サーバー側で認証チェック
  const session = await auth();

  // 未ログインの場合はDashboardContentに渡す（モーダル表示）
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

  // お気に入り配信者の数を取得（認証スキップ判定用）
  const favoriteCount = await prisma.favoriteStreamer.count({
    where: { userId: session.user.id },
  });

  const skipAuth = favoriteCount === 0;

  // 認証済みユーザーの情報をクライアントコンポーネントに渡す
  return (
    <DashboardContent
      userId={session.user.id!}
      userEmail={session.user.email!}
      isAuthenticated={true}
      skipAuth={skipAuth}
    />
  );
}
