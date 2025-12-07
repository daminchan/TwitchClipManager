// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - ページ遷移時のローディングオーバーレイ

'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * ページ遷移時のローディングオーバーレイ
 *
 * パス変更を検知して全画面ローディングを表示
 */
export function PageLoadingOverlay() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [previousPath, setPreviousPath] = useState(pathname);

  useEffect(() => {
    // パスが変更されたらローディング開始
    if (pathname !== previousPath) {
      setIsLoading(true);
      setPreviousPath(pathname);

      // ローディングを自動的に終了（Next.jsのレンダリング後）
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [pathname, previousPath]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] flex items-center justify-center animate-in fade-in duration-200">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-300 text-sm font-medium">読み込み中...</p>
      </div>
    </div>
  );
}
