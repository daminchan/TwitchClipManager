// - FolderDeleteConfirmと同じUIパターン

'use client';

import { useState, useTransition } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { removeFavoriteStreamer } from '@/actions/favorites';
import type { FavoriteStreamer } from '@/types/database';

interface StreamerDeleteConfirmProps {
  isOpen: boolean;
  streamer: FavoriteStreamer | null;
  onClose: () => void;
  onSuccess: (deletedStreamerId: string) => void;
}

export function StreamerDeleteConfirm({ isOpen, streamer, onClose, onSuccess }: StreamerDeleteConfirmProps) {
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  if (!isOpen || !streamer) return null;

  const handleDelete = async () => {
    setError('');

    const streamerId = streamer.streamerId;

    startTransition(async () => {
      const result = await removeFavoriteStreamer(streamerId);

      if (result.success) {
        onClose();
        onSuccess(streamerId);
      } else {
        setError(result.message);
      }
    });
  };

  const handleClose = () => {
    if (!isPending) {
      setError('');
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container-sm border-red-900/50">
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-900/30 rounded-full">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-title">お気に入りから削除</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isPending}
            className="modal-close-btn button-press-feedback"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 space-y-4">
          {/* 配信者情報 */}
          <div className="flex items-center gap-4 p-4 bg-[#1a1a1a] rounded-lg">
            <div className="relative w-16 h-16 flex-shrink-0">
              {streamer.streamerImage ? (
                <Image
                  src={streamer.streamerImage}
                  alt={streamer.streamerName}
                  fill
                  className="rounded-full object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-purple-600 flex items-center justify-center">
                  <span className="text-xl text-white font-bold">
                    {streamer.streamerName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold text-white text-lg">{streamer.streamerName}</p>
              <p className="text-gray-400 text-sm">@{streamer.streamerLogin}</p>
            </div>
          </div>

          <p className="text-gray-300">
            この配信者をお気に入りから削除しますか？
          </p>
          <p className="text-description">
            削除すると、この配信者のクリップはダッシュボードに表示されなくなります。
          </p>

          {error && (
            <p className="text-error bg-red-900/20 border border-red-900/50 rounded p-3">
              {error}
            </p>
          )}

          {/* アクションボタン */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
              className="flex-1 border-gray-700 text-gray-300 hover:bg-[#1a1a1a] button-press-feedback"
            >
              キャンセル
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white button-press-feedback"
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  削除中...
                </div>
              ) : (
                '削除'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
