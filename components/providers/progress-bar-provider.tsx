// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - YouTubeスタイルのローディングバー実装
// - リンククリック時に即座に開始

'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';
import NProgress from 'nprogress';

/**
 * ページ遷移時のローディングバー表示コンポーネント
 *
 * YouTubeスタイルの画面上部に表示される細い進捗バー
 * - リンククリック時に即座に開始
 * - ページ読み込み完了時にフェードアウト
 * - Twitchテーマカラー（紫）を使用
 */
export function ProgressBarProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // パス変更時にProgressBarを完了
  useEffect(() => {
    NProgress.done();
  }, [pathname]);

  // 内部リンククリック時に即座にProgressBarを開始
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');

      if (link) {
        const href = link.getAttribute('href');
        // 内部リンクかつ現在のパスと異なる場合
        if (
          href &&
          href.startsWith('/') &&
          !href.startsWith('//') &&
          href !== pathname &&
          !link.hasAttribute('target') // 新しいタブで開くリンクは除外
        ) {
          NProgress.start();
        }
      }
    };

    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, [pathname]);

  return (
    <>
      {/* YouTubeスタイルのローディングバー */}
      <ProgressBar
        height="4px"
        color="#9146FF"
        options={{
          showSpinner: false,
          easing: 'ease',
          speed: 200,
          trickle: true,
          trickleSpeed: 80,
          minimum: 0.1,
        }}
        shallowRouting={false}
        style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 9999;
          box-shadow: 0 0 15px #9146FF, 0 0 8px #9146FF;
        "
      />
      {children}
    </>
  );
}
