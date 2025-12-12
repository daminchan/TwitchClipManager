// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション8.2: Props型定義

'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Trash2, Users, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { removeStreamerFromFolder } from '@/actions/folders';
import type { Folder, FolderStreamer } from '@/types/database';

interface FolderStreamersModalProps {
  isOpen: boolean;
  folder: Folder | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function FolderStreamersModal({ isOpen, folder, onClose, onSuccess }: FolderStreamersModalProps) {
  const [localStreamers, setLocalStreamers] = useState<FolderStreamer[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const pendingCountRef = useRef(0); // 非同期処理中のカウント追跡用

  // folderが変更されたらローカルステートを更新（楽観的更新用）
  useEffect(() => {
    if (folder?.folderStreamers) {
      setLocalStreamers(folder.folderStreamers);
    }
  }, [folder]);

  // モーダルが開いたときにpendingCountをリセット
  useEffect(() => {
    if (isOpen) {
      setPendingCount(0);
      pendingCountRef.current = 0;
    }
  }, [isOpen]);

  if (!isOpen || !folder) return null;

  const handleRemoveStreamer = async (streamerId: string) => {
    // 楽観的更新：即座にUIから削除
    const previousStreamers = [...localStreamers];
    const updatedStreamers = localStreamers.filter(s => s.streamerId !== streamerId);
    setLocalStreamers(updatedStreamers);

    // 同期中カウントを増加
    setPendingCount(prev => prev + 1);
    pendingCountRef.current += 1;

    // バックグラウンドでAPI呼び出し
    const result = await removeStreamerFromFolder(folder.id, streamerId);

    // 同期中カウントを減少
    pendingCountRef.current -= 1;
    setPendingCount(pendingCountRef.current);

    if (result.success) {
      onSuccess();
    } else {
      // エラー時は元に戻す（ロールバック）
      setLocalStreamers(previousStreamers);
      alert(result.message);
    }
  };

  const handleClose = () => {
    // 同期中は閉じれない
    if (pendingCount > 0) return;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-[#0f0f0f] rounded-lg shadow-2xl border border-[#2a2a2a] overflow-hidden max-h-[80vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${folder.color}20` }}
            >
              <Users className="w-5 h-5" style={{ color: folder.color }} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-100">{folder.name}</h2>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-400">
                  {localStreamers.length}人の配信者
                </p>
                {/* 同期中インジケーター */}
                {pendingCount > 0 && (
                  <span className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    同期中: {pendingCount}件
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={pendingCount > 0}
            className={`p-2 rounded-full transition-colors button-press-feedback ${
              pendingCount > 0
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-[#1a1a1a]'
            }`}
            aria-label="閉じる"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto p-6">
          {localStreamers.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 mb-2">配信者がいません</p>
              <p className="text-sm text-gray-500">
                お気に入り配信者ページからドラッグ＆ドロップで追加できます
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {localStreamers.map((streamer) => {
                // temp-で始まるIDは同期中（楽観的UI追加中）
                const isSyncing = streamer.id.startsWith('temp-');

                return (
                  <div
                    key={streamer.id}
                    className={`relative group rounded-lg p-4 transition-all duration-200 ${
                      isSyncing
                        ? 'bg-[#1a1a1a]/50 cursor-not-allowed'
                        : 'bg-[#1a1a1a] hover:bg-[#222222]'
                    }`}
                  >
                    {/* 同期中バッジ */}
                    {isSyncing && (
                      <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                        <span className="flex items-center gap-1 text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          追加中
                        </span>
                      </div>
                    )}

                    <div className={`flex items-center gap-3 ${isSyncing ? 'opacity-50' : ''}`}>
                      {/* プロフィール画像 */}
                      <div className="relative w-12 h-12 flex-shrink-0">
                        {streamer.streamerImage ? (
                          <Image
                            src={streamer.streamerImage}
                            alt={streamer.streamerName}
                            fill
                            className="rounded-full object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-purple-600 flex items-center justify-center">
                            <span className="text-lg text-white font-bold">
                              {streamer.streamerName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 配信者情報 */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-100 truncate">
                          {streamer.streamerName}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          @{streamer.streamerLogin}
                        </p>
                      </div>

                      {/* 削除ボタン（同期中は非表示） */}
                      {!isSyncing && (
                        <button
                          onClick={() => handleRemoveStreamer(streamer.streamerId)}
                          className="p-2 hover:bg-red-900/30 rounded transition-colors button-press-feedback opacity-0 group-hover:opacity-100"
                          aria-label="フォルダから削除"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="p-6 border-t border-[#2a2a2a]">
          <Button
            onClick={handleClose}
            disabled={pendingCount > 0}
            className={`w-full button-press-feedback ${
              pendingCount > 0
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
            variant="outline"
          >
            {pendingCount > 0 ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                同期完了までお待ちください...
              </span>
            ) : (
              '閉じる'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
