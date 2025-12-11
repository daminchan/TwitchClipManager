// 適用スキル: component-creator
// 適用ルール:
// - セクション4.1: ファイル命名規則（kebab-case）
// - セクション4.6: コンポーネント構造
// - セクション8.2: Props型定義
// - プロジェクト統一のデザイン（紫系グラデーション）

import { cn } from '@/lib/utils';
import { LABELS } from '@/lib/constants';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface LoadingSpinnerProps {
  /** スピナーのサイズ */
  size?: SpinnerSize;
  /** ローディングテキスト（省略するとテキストなし） */
  text?: string;
  /** テキストを非表示にする */
  hideText?: boolean;
  /** ドットアニメーションを表示する */
  showDots?: boolean;
  /** 追加のCSSクラス */
  className?: string;
}

const sizeConfig: Record<SpinnerSize, { outer: string; inner: string; glow: string; text: string }> = {
  sm: {
    outer: 'w-8 h-8 border-2',
    inner: 'w-8 h-8 border-2',
    glow: 'w-3 h-3',
    text: 'text-xs',
  },
  md: {
    outer: 'w-12 h-12 border-3',
    inner: 'w-12 h-12 border-3',
    glow: 'w-5 h-5',
    text: 'text-sm',
  },
  lg: {
    outer: 'w-20 h-20 border-4',
    inner: 'w-20 h-20 border-4',
    glow: 'w-8 h-8',
    text: 'text-sm',
  },
};

export function LoadingSpinner({
  size = 'md',
  text,
  hideText = false,
  showDots = false,
  className,
}: LoadingSpinnerProps) {
  const config = sizeConfig[size];
  const displayText = text ?? LABELS.MESSAGES.LOADING;

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* メインローダー */}
      <div className="relative">
        {/* 外側のリング（ゆっくり回転） */}
        <div
          className={cn(
            'rounded-full border-purple-900/30 animate-spin-slow',
            config.outer
          )}
        />

        {/* 内側のリング（速く回転） */}
        <div
          className={cn(
            'absolute inset-0 rounded-full border-transparent border-t-purple-500 animate-spin',
            config.inner
          )}
        />

        {/* 中央のグロー */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              'bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-pulse shadow-lg shadow-purple-500/50',
              config.glow
            )}
          />
        </div>
      </div>

      {/* テキスト */}
      {!hideText && (
        <div className="flex flex-col items-center gap-2">
          <p className={cn('text-gray-300 font-medium animate-pulse', config.text)}>
            {displayText}
          </p>
          {/* ドットアニメーション */}
          {showDots && (
            <div className="flex gap-1">
              <span
                className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <span
                className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="w-2 h-2 bg-purple-300 rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * ページ全体のローディング表示用
 * loading.tsxなどで使用
 */
export function PageLoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] w-full">
      <LoadingSpinner size="lg" showDots />
    </div>
  );
}

/**
 * インラインのローディング表示用
 * ボタン内やリスト内で使用
 */
export function InlineLoadingSpinner({ text }: { text?: string }) {
  return (
    <LoadingSpinner size="sm" text={text} className="py-4" />
  );
}

/**
 * セクションローディング表示用
 * コンテンツエリア内で使用
 */
export function SectionLoadingSpinner({ text }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner size="md" text={text} />
    </div>
  );
}
