// 適用スキル: page-creator
// 適用ルール:
// - セクション3: ディレクトリ構造
// - Next.js App Router ベストプラクティス

import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/constants';

/**
 * ダッシュボードページ（レガシー）
 *
 * このページは後方互換性のために残されています。
 * すべてのトラフィックを `/` (ホーム) にリダイレクトします。
 */
export default function DashboardPage() {
  redirect(ROUTES.HOME);
}
