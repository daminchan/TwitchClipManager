'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { CACHE_TIME } from '@/lib/constants';

/**
 * React Query プロバイダーコンポーネント
 *
 * アプリケーション全体で React Query を使用可能にする
 *
 * キャッシュ戦略:
 * - staleTime: 5分（データが新鮮とみなされる期間）
 * - gcTime: 10分（キャッシュ保持期間）
 * - retry: 1回（エラー時の再試行回数）
 * - refetchOnWindowFocus: false（ウィンドウフォーカス時の自動再取得を無効化）
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: CACHE_TIME.DEFAULT_STALE_TIME,
            gcTime: CACHE_TIME.DEFAULT_GC_TIME,
            retry: 1, // 失敗時1回のみリトライ
            refetchOnWindowFocus: false, // フォーカス時の自動再取得無効
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
