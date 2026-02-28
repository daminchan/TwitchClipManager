/**
 * 無限スクロール用カスタムフック
 *
 * 適用ルール:
 * - セクション14.2: カスタムフック（複雑なロジック分離）
 * - セクション17: 定数管理（INFINITE_SCROLL定数使用）
 *
 * 機能:
 * - Intersection Observerを使用した無限スクロール検知
 * - ローディング状態の管理
 * - 追加読み込みのコールバック実行
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { INFINITE_SCROLL, ANIMATION } from '@/lib/constants';

interface UseInfiniteScrollOptions {
  /** さらに読み込むデータがあるか */
  hasMore: boolean;
  /** 追加読み込み時のコールバック */
  onLoadMore: () => void;
  /** 発火位置（ビューポートからの距離） */
  rootMargin?: string;
  /** 交差割合 */
  threshold?: number;
  /** 追加読み込み時の遅延（ms） */
  delay?: number;
}

interface UseInfiniteScrollReturn {
  /** 監視対象要素に設定するref */
  loadMoreRef: React.RefObject<HTMLDivElement | null>;
  /** 読み込み中かどうか */
  isLoadingMore: boolean;
}

/**
 * 無限スクロールを実装するためのカスタムフック
 *
 * @example
 * const { loadMoreRef, isLoadingMore } = useInfiniteScroll({
 *   hasMore: displayedCount < totalCount,
 *   onLoadMore: () => setDisplayedCount(prev => prev + 20),
 * });
 *
 * return (
 *   <div>
 *     {items.map(item => <Item key={item.id} />)}
 *     {hasMore && <div ref={loadMoreRef}>{isLoadingMore && 'Loading...'}</div>}
 *   </div>
 * );
 */
export function useInfiniteScroll({
  hasMore,
  onLoadMore,
  rootMargin = INFINITE_SCROLL.ROOT_MARGIN,
  threshold = INFINITE_SCROLL.THRESHOLD,
  delay = ANIMATION.LOAD_MORE_DELAY,
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // isLoadingMoreをrefで管理（コールバックの再生成を防止 — ルール5.12）
  const isLoadingMoreRef = useRef(false);

  // 読み込み処理（遅延付き）— 関数型setState使用（ルール5.9）
  const handleLoadMore = useCallback(() => {
    if (isLoadingMoreRef.current || !hasMore) return;

    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    setTimeout(() => {
      onLoadMore();
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }, delay);
  }, [hasMore, onLoadMore, delay]);

  // Intersection Observerのコールバック
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoadingMoreRef.current) {
        handleLoadMore();
      }
    },
    [hasMore, handleLoadMore]
  );

  // Intersection Observerの設定
  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin,
      threshold,
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [handleObserver, rootMargin, threshold]);

  return {
    loadMoreRef,
    isLoadingMore,
  };
}
