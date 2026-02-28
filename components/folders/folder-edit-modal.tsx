'use client';

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateFolder } from '@/actions/folders';
import { modalOverlay, modalContent } from '@/lib/animations';
import { FOLDER_COLORS } from '@/lib/constants';
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

  // フォルダ情報をフォームに反映
  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setSelectedColor(folder.color);
    }
  }, [folder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folder) return;
    setError('');

    if (!name.trim()) {
      setError('フォルダ名を入力してください');
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
          >
            <div className="modal-header">
              <h2 className="text-title">フォルダを編集</h2>
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
                  フォルダ名
                </label>
                <Input
                  id="folder-name-edit"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例: ぶいすぽ"
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
                  フォルダの色
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
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f0f0f] scale-110'
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
                  className="flex-1 border-gray-700 text-gray-300 hover:bg-[#1a1a1a] button-press-feedback"
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  disabled={!name.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white button-press-feedback"
                >
                  更新
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
