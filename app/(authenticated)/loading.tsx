// 適用ルール:
// - Next.js App Router ベストプラクティス
// - 共通ローディングコンポーネントを使用
// - プロジェクト統一のデザイン（紫系グラデーション）

import { PageLoadingSpinner } from '@/components/ui/loading-spinner';

export default function Loading() {
  return <PageLoadingSpinner />;
}
