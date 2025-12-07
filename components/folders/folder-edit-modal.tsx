// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション8.2: Props型定義

'use client';

import { useState, useTransition, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateFolder } from '@/actions/folders';
import { FOLDER_COLORS } from '@/lib/constants';
import type { Folder } from '@/types/database';

interface FolderEditModalProps {
  isOpen: boolean;
  folder: Folder | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function FolderEditModal({ isOpen, folder, onClose, onSuccess }: FolderEditModalProps) {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(FOLDER_COLORS[0].value);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  // フォルダ情報をフォームに反映
  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setSelectedColor(folder.color);
    }
  }, [folder]);

  if (!isOpen || !folder) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('フォルダ名を入力してください');
      return;
    }

    startTransition(async () => {
      const result = await updateFolder(folder.id, {
        name: name.trim(),
        color: selectedColor,
      });

      if (result.success) {
        onSuccess();
        onClose();
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-[#0f0f0f] rounded-lg shadow-2xl border border-[#2a2a2a] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
          <h2 className="text-xl font-bold text-gray-100">フォルダを編集</h2>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* フォルダ名 */}
          <div>
            <label htmlFor="folder-name-edit" className="block text-sm font-medium text-gray-300 mb-2">
              フォルダ名
            </label>
            <Input
              id="folder-name-edit"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: ぶいすぽ"
              disabled={isPending}
              className="bg-[#1a1a1a] border-gray-700 text-gray-100 placeholder-gray-500"
              maxLength={50}
            />
            {error && (
              <p className="text-sm text-red-400 mt-2">{error}</p>
            )}
          </div>

          {/* カラー選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              フォルダの色
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
              disabled={isPending}
              className="flex-1 border-gray-700 text-gray-300 hover:bg-[#1a1a1a] button-press-feedback"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={isPending || !name.trim()}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white button-press-feedback"
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  更新中...
                </div>
              ) : (
                '更新'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
