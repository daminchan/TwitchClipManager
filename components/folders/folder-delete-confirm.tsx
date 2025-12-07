// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション8.2: Props型定義

'use client';

import { useState, useTransition } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteFolder } from '@/actions/folders';
import type { Folder } from '@/types/database';

interface FolderDeleteConfirmProps {
  isOpen: boolean;
  folder: Folder | null;
  onClose: () => void;
  onSuccess: (deletedFolderId: string) => void;
}

export function FolderDeleteConfirm({ isOpen, folder, onClose, onSuccess }: FolderDeleteConfirmProps) {
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  if (!isOpen || !folder) return null;

  const handleDelete = async () => {
    setError('');

    const folderId = folder.id;

    startTransition(async () => {
      const result = await deleteFolder(folderId);

      if (result.success) {
        // 成功時のみモーダルを閉じて親に通知
        onClose();
        onSuccess(folderId);
      } else {
        // エラー時はエラーを表示
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-[#0f0f0f] rounded-lg shadow-2xl border border-red-900/50 overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-900/30 rounded-full">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-100">フォルダを削除</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isPending}
            className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors button-press-feedback"
            aria-label="閉じる"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 space-y-4">
          <p className="text-gray-300">
            フォルダ <span className="font-semibold text-white">「{folder.name}」</span> を削除しますか？
          </p>
          <p className="text-sm text-gray-400">
            このフォルダに追加されている配信者は削除されません。フォルダのみが削除されます。
          </p>

          {error && (
            <p className="text-sm text-red-400 bg-red-900/20 border border-red-900/50 rounded p-3">
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
