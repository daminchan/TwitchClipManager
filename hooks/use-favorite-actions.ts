/**
 * お気に入り配信者操作のカスタムフック
 * 4つのコンテンツコンポーネント(dashboard, favorites-clips, favorites, settings)で共通使用
 *
 * 適用ルール:
 * - CLAUDE.md セクション14.2: カスタムフックによるロジック分離
 * - CLAUDE.md セクション4.3: 関数命名規則（camelCase）
 * - CLAUDE.md セクション4.1: ファイル命名規則（kebab-case）
 * - 楽観的UI: 即座にUIを更新し、エラー時はロールバック
 */

'use client';

import { useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { addFavoriteStreamer } from '@/actions/favorites';
import type { TwitchChannel } from '@/types';
import type { FavoriteStreamer } from '@/types/database';

/**
 * お気に入り配信者の追加処理を管理するカスタムフック
 * 楽観的UIで即座にリストを更新し、体感速度を向上
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
   * お気に入り配信者を追加（楽観的UI）
   * @param streamer 追加する配信者情報
   * @param onSuccess 成功時のコールバック
   * @param onError エラー時のコールバック
   */
  const handleAddFavorite = async (
    streamer: TwitchChannel,
    onSuccess?: (message: string) => void,
    onError?: (message: string, type: 'info' | 'error') => void
  ) => {
    // 楽観的UI: 即座にキャッシュを更新
    const tempId = `temp-${Date.now()}`;
    const optimisticStreamer: FavoriteStreamer = {
      id: tempId,
      streamerId: streamer.id,
      streamerName: streamer.display_name,
      streamerLogin: streamer.broadcaster_login,
      streamerImage: streamer.thumbnail_url.replace('{width}', '300').replace('{height}', '300'),
      createdAt: new Date(),
    };

    // 既存のキャッシュを保存（ロールバック用）
    const previousFavorites = queryClient.getQueryData(['favorites']);

    // 即座にUIを更新
    queryClient.setQueryData(['favorites'], (old: FavoriteStreamer[] | undefined) => {
      if (!old) return [optimisticStreamer];
      // 重複チェック
      if (old.some(f => f.streamerId === streamer.id)) {
        return old;
      }
      return [...old, optimisticStreamer];
    });

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
          // サーバーのデータと同期（正しいIDで更新）
          await queryClient.invalidateQueries({ queryKey: ['favorites'] });
          // クリップは遅延更新（バックグラウンド）
          queryClient.invalidateQueries({
            queryKey: ['clips', 'favorites'],
            refetchType: 'active'
          });
        } else {
          // エラー時はロールバック
          queryClient.setQueryData(['favorites'], previousFavorites);
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
