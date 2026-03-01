'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteFolder } from '@/actions/folders';
import { modalOverlay, modalContent } from '@/lib/animations';
import { LABELS } from '@/lib/constants';
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

  const handleDelete = async () => {
    if (!folder) return;
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
    <AnimatePresence>
      {isOpen && folder && (
        <motion.div
          className="modal-overlay"
          variants={modalOverlay}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div
            className="modal-container-sm border-red-900/50"
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="alertdialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-full">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <h2 className="text-title">フォルダを削除</h2>
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

            <div className="p-6 space-y-4">
              <p className="text-[#6b655c]">
                フォルダ <span className="font-semibold text-[#44403c]">「{folder.name}」</span> を削除しますか？
              </p>
              <p className="text-description">
                このフォルダに追加されている配信者は削除されません。フォルダのみが削除されます。
              </p>

              {error && (
                <p className="text-error bg-red-50 border border-red-200 rounded p-3">
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
                  className="flex-1 btn-secondary button-press-feedback"
                >
                  {LABELS.BUTTONS.CANCEL}
                </Button>
                <Button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="flex-1 btn-danger button-press-feedback"
                >
                  {isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {LABELS.BUTTONS.DELETING}
                    </div>
                  ) : (
                    LABELS.BUTTONS.DELETE
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
