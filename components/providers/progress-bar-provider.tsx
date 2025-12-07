// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - YouTubeスタイルのローディングバー実装

'use client';

import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';

/**
 * ページ遷移時のローディングバー表示コンポーネント
 *
 * YouTubeスタイルの画面上部に表示される細い進捗バー
 * - ページ遷移開始時に表示
 * - ページ読み込み完了時にフェードアウト
 * - Twitchテーマカラー（紫）を使用
 */
export function ProgressBarProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* YouTubeスタイルのローディングバー */}
      <ProgressBar
        height="4px"
        color="#9146FF"
        options={{
          showSpinner: false,
          easing: 'ease',
          speed: 300,
          trickle: true,
          trickleSpeed: 100,
          minimum: 0.08,
        }}
        shallowRouting={false}
        style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 9999;
          box-shadow: 0 0 10px #9146FF, 0 0 5px #9146FF;
        "
      />
      {children}
    </>
  );
}
