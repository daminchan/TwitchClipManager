'use client';

import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateFolder } from '@/actions/folders';
import { modalOverlay, modalContent } from '@/lib/animations';
import { FOLDER_COLORS, LABELS } from '@/lib/constants';
import type { Folder } from '@/types/database';

interface FolderEditModalProps {
  isOpen: boolean;
  folder: Folder | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function FolderEditModal({ isOpen, folder, onClose, onSuccess }: FolderEditModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(FOLDER_COLORS[0].value);
  const [error, setError] = useState('');

  // フォルダIDが変更されたら即座にリセット（前のデータが表示される問題を防止）
  const prevFolderIdRef = useRef<string | null>(null);
  useEffect(() => {
    const currentId = folder?.id || null;
    if (currentId !== prevFolderIdRef.current) {
      setName(folder?.name || '');
      setSelectedColor(folder?.color || FOLDER_COLORS[0].value);
      prevFolderIdRef.current = currentId;
    }
  }, [folder?.id, folder?.name, folder?.color]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folder) return;
    setError('');

    if (!name.trim()) {
      setError(LABELS.ERRORS.FOLDER_NAME_REQUIRED);
      return;
    }

    const updatedName = name.trim();
    const updatedColor = selectedColor;

    // 楽観的UI: 即座にキャッシュを更新
    queryClient.setQueryData<{ data: Folder[] }>(['folders'], (oldData) => {
      if (!oldData?.data) return oldData;
      return {
        ...oldData,
        data: oldData.data.map((f: Folder) =>
          f.id === folder.id
            ? { ...f, name: updatedName, color: updatedColor }
            : f
        ),
      };
    });

    // モーダルを即座に閉じる
    onClose();

    // バックグラウンドでサーバーアクション実行
    const result = await updateFolder(folder.id, {
      name: updatedName,
      color: updatedColor,
    });

    if (result.success) {
      onSuccess();
    } else {
      // エラー時はロールバック
      await queryClient.invalidateQueries({ queryKey: ['folders'] });
      setError(result.message);
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
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
            className="modal-container-sm"
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-label={LABELS.FOLDERS.EDIT_FOLDER}
          >
            <div className="modal-header">
              <h2 className="text-title">{LABELS.FOLDERS.EDIT_FOLDER}</h2>
              <button
                onClick={handleClose}
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
                <label htmlFor="folder-name-edit" className="text-label">
                  {LABELS.FOLDERS.FOLDER_NAME}
                </label>
                <Input
                  id="folder-name-edit"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={LABELS.PLACEHOLDERS.FOLDER_NAME}
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
                      className={`
                        relative h-12 rounded-lg transition-all duration-200 button-press-feedback
                        ${selectedColor === color.value
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-white scale-110'
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
                  className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-100 button-press-feedback"
                >
                  {LABELS.BUTTONS.CANCEL}
                </Button>
                <Button
                  type="submit"
                  disabled={!name.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white button-press-feedback"
                >
                  {LABELS.BUTTONS.UPDATE_LABEL}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
