/**
 * お気に入り配信者操作のカスタムフック
 * 4つのコンテンツコンポーネント(dashboard, favorites-clips, favorites, settings)で共通使用
 *
 * 適用ルール:
 * - CLAUDE.md セクション14.2: カスタムフックによるロジック分離
 * - CLAUDE.md セクション4.3: 関数命名規則（camelCase）
 * - CLAUDE.md セクション4.1: ファイル命名規則（kebab-case）
 */

'use client';

import { useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { addFavoriteStreamer } from '@/actions/favorites';
import type { TwitchChannel } from '@/types';

/**
 * お気に入り配信者の追加処理を管理するカスタムフック
 *
 * @example
 * const { handleAddFavorite, isPending } = useFavoriteActions();
 *
 * // お気に入りに追加
 * await handleAddFavorite(
 *   streamer,
 *   (message) => showToast(message, 'success'),
 *   (message, type) => showToast(message, type)
 * );
 */
export function useFavoriteActions() {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  /**
   * お気に入り配信者を追加
   * @param streamer 追加する配信者情報
   * @param onSuccess 成功時のコールバック
   * @param onError エラー時のコールバック
   */
  const handleAddFavorite = async (
    streamer: TwitchChannel,
    onSuccess?: (message: string) => void,
    onError?: (message: string, type: 'info' | 'error') => void
  ) => {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        const result = await addFavoriteStreamer(
          streamer.id,
          streamer.display_name,
          streamer.broadcaster_login,
          streamer.thumbnail_url.replace('{width}', '300').replace('{height}', '300')
        );

        if (result.success) {
          onSuccess?.(result.message);
          // キャッシュを無効化してお気に入りリストを更新
          await queryClient.invalidateQueries({ queryKey: ['favorites'] });
          await queryClient.invalidateQueries({
            queryKey: ['clips', 'favorites'],
            refetchType: 'active'
          });
        } else {
          const errorType = result.error === 'Already exists' ? 'info' : 'error';
          onError?.(result.message, errorType);
        }

        // 処理完了をresolve
        resolve();
      });
    });
  };

  return {
    handleAddFavorite,
    isPending,
  };
}
