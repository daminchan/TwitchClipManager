'use client';

import { useState, useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { modalOverlay, modalContent } from '@/lib/animations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createFolder } from '@/actions/folders';
import { FOLDER_COLORS, LABELS } from '@/lib/constants';
import type { Folder } from '@/types/database';

interface FolderCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onFolderIdResolved?: (tempId: string, realId: string) => void;
}

export function FolderCreateModal({ isOpen, onClose, onSuccess, onFolderIdResolved }: FolderCreateModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(FOLDER_COLORS[0].value);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError(LABELS.ERRORS.FOLDER_NAME_REQUIRED);
      return;
    }

    const tempFolder = {
      id: `temp-${Date.now()}`,
      userId: 'temp',
      name: name.trim(),
      color: selectedColor,
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      folderStreamers: [],
    };

    // 楽観的UI: 即座にキャッシュを更新
    queryClient.setQueryData<{ data: Folder[] }>(['folders'], (oldData) => {
      if (!oldData?.data) return { data: [tempFolder] };
      return {
        ...oldData,
        data: [...oldData.data, tempFolder],
      };
    });

    // モーダルを即座に閉じる
    setName('');
    setSelectedColor(FOLDER_COLORS[0].value);
    onClose();

    // バックグラウンドでサーバーアクション実行
    startTransition(async () => {
      const result = await createFolder({ name: tempFolder.name, color: selectedColor });

      if (result.success) {
        // temp→real IDマッピングを通知（キュー処理完了を待ってからinvalidate）
        if (result.data?.id && onFolderIdResolved) {
          await onFolderIdResolved(tempFolder.id, result.data.id);
        }
        // キュー処理完了後に実データで上書き
        onSuccess();
      } else {
        // エラー時はロールバックして再度モーダルを開く
        await queryClient.invalidateQueries({ queryKey: ['folders'] });
        setError(result.message);
      }
    });
  };

  const handleClose = () => {
    if (!isPending) {
      setName('');
      setSelectedColor(FOLDER_COLORS[0].value);
      setError('');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="modal-overlay" variants={modalOverlay} initial="hidden" animate="visible" exit="exit">
          <motion.div className="modal-container-sm" variants={modalContent} initial="hidden" animate="visible" exit="exit" role="dialog" aria-modal="true" aria-label={LABELS.FOLDERS.NEW_FOLDER}>
        <div className="modal-header">
          <h2 className="text-title">{LABELS.FOLDERS.NEW_FOLDER}</h2>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* フォルダ名 */}
          <div>
            <label htmlFor="folder-name" className="text-label">
              {LABELS.FOLDERS.FOLDER_NAME}
            </label>
            <Input
              id="folder-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={LABELS.PLACEHOLDERS.FOLDER_NAME}
              disabled={isPending}
              className="input-dark"
              maxLength={50}
            />
            {error && (
              <p className="text-error mt-2">{error}</p>
            )}
          </div>

          {/* カラー選択 */}
          <div>
            <label className="text-label">
              {LABELS.FOLDERS.FOLDER_COLOR}
            </label>
            <div className="grid grid-cols-4 gap-3">
              {FOLDER_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  disabled={isPending}
                  className={`
                    relative h-12 rounded-lg transition-all duration-200 button-press-feedback
                    ${selectedColor === color.value
                      ? 'ring-2 ring-[#44403c] ring-offset-2 ring-offset-[#faf8f5] scale-110'
                      : 'hover:scale-105'
                    }
                  `}
                  style={{ backgroundColor: color.value }}
                  aria-label={color.name}
                >
                  {selectedColor === color.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

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
              type="submit"
              disabled={isPending || !name.trim()}
              className="flex-1 btn-primary button-press-feedback"
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {LABELS.BUTTONS.CREATING}
                </div>
              ) : (
                LABELS.BUTTONS.CREATE
              )}
            </Button>
          </div>
        </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
