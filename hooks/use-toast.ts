/**
 * Toast通知のカスタムフック
 * 4つのコンテンツコンポーネント(dashboard, favorites-clips, favorites, settings)で共通使用
 *
 * 適用ルール:
 * - CLAUDE.md セクション14.2: カスタムフックによるロジック分離
 * - CLAUDE.md セクション4.3: 関数命名規則（camelCase）
 * - CLAUDE.md セクション4.1: ファイル命名規則（kebab-case）
 */

'use client';

import { useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  message: string;
  type: ToastType;
}

/**
 * Toast通知を管理するカスタムフック
 *
 * @example
 * const { toast, showToast, hideToast } = useToast();
 *
 * // 成功メッセージを表示
 * showToast('保存しました', 'success');
 *
 * // エラーメッセージを表示
 * showToast('エラーが発生しました', 'error');
 *
 * // JSXで表示
 * {toast && <Toast {...toast} onClose={hideToast} />}
 */
export function useToast() {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  /**
   * Toast通知を表示
   * @param message 表示するメッセージ
   * @param type トーストの種類（success/error/info）
   */
  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  };

  /**
   * Toast通知を非表示
   */
  const hideToast = () => {
    setToast(null);
  };

  return {
    toast,
    showToast,
    hideToast,
  };
}
