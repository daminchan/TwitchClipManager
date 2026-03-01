'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Users, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { removeStreamerFromFolder } from '@/actions/folders';
import { modalOverlay, modalContent } from '@/lib/animations';
import { LABELS } from '@/lib/constants';
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
  const prevFolderIdRef = useRef<string | null>(null);

  // フォルダIDが変更されたら即座にステートをリセット（前のフォルダの内容が表示される問題を防止）
  useEffect(() => {
    const currentFolderId = folder?.id || null;

    if (currentFolderId !== prevFolderIdRef.current) {
      // フォルダが変わったので即座にリセット
      setLocalStreamers(folder?.folderStreamers || []);
      setPendingCount(0);
      pendingCountRef.current = 0;
      prevFolderIdRef.current = currentFolderId;
    } else if (folder?.folderStreamers) {
      // 同じフォルダのデータ更新
      setLocalStreamers(folder.folderStreamers);
    }
  }, [folder]);

  const handleRemoveStreamer = async (streamerId: string) => {
    if (!folder) return;
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
            className="modal-container-md sm:max-h-[80vh] flex flex-col"
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-label={folder.name}
          >
            {/* ヘッダー */}
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${folder.color}20` }}
                >
                  <Users className="w-5 h-5" style={{ color: folder.color }} />
                </div>
                <div>
                  <h2 className="text-title">{folder.name}</h2>
                  <div className="flex items-center gap-2">
                    <p className="text-description">
                      {localStreamers.length}{LABELS.FOLDERS.STREAMERS_COUNT_SUFFIX}
                    </p>
                    {/* 同期中インジケーター */}
                    {pendingCount > 0 && (
                      <span className="flex items-center gap-1.5 text-xs text-[#6890a8] bg-[#e4e9ee] px-2 py-0.5 rounded-full">
                        <div className="animate-spin"><RefreshCw className="w-3 h-3" /></div>
                        同期中: {pendingCount}件
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={pendingCount > 0}
                className={`modal-close-btn button-press-feedback ${
                  pendingCount > 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                aria-label="閉じる"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* コンテンツ */}
            <div className="modal-body">
              {localStreamers.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="w-16 h-16 mx-auto mb-4 text-[#c4bdb2]" />
                  <p className="text-[#6b655c] mb-2">{LABELS.FOLDERS.NO_STREAMERS}</p>
                  <p className="text-description">
                    {LABELS.FOLDERS.NO_STREAMERS_DESC}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {localStreamers.map((streamer) => {
                    // temp-で始まるIDは同期中（楽観的UI追加中）
                    const isSyncing = streamer.id.startsWith('temp-');

                    return (
                      <div
                        key={streamer.id}
                        className={`relative group rounded-lg p-4 transition-all duration-200 ${
                          isSyncing
                            ? 'bg-[#faf8f5]/50 cursor-not-allowed'
                            : 'bg-[#faf8f5] hover:bg-[#ebe5dc]'
                        }`}
                      >
                        {/* 同期中バッジ */}
                        {isSyncing && (
                          <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                            <span className="flex items-center gap-1 text-xs text-[#6890a8] bg-[#e4e9ee] px-2 py-0.5 rounded-full">
                              <div className="animate-spin"><RefreshCw className="w-3 h-3" /></div>
                              {LABELS.BUTTONS.ADDING}
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
                              <div className="w-full h-full rounded-full bg-[#c4bdb2] flex items-center justify-center">
                                <span className="text-lg text-white font-bold">
                                  {streamer.streamerName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* 配信者情報 */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#44403c] truncate">
                              {streamer.streamerName}
                            </p>
                            <p className="text-xs text-[#a09890] truncate">
                              @{streamer.streamerLogin}
                            </p>
                          </div>

                          {/* 削除ボタン（同期中は非表示） */}
                          {!isSyncing && (
                            <button
                              onClick={() => handleRemoveStreamer(streamer.streamerId)}
                              className="p-2 hover:bg-red-50 rounded transition-colors button-press-feedback opacity-0 group-hover:opacity-100"
                              aria-label="フォルダから削除"
                            >
                              <Trash2 className="w-4 h-4 text-[#c4bdb2] hover:text-red-400" />
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
            <div className="modal-footer">
              <Button
                onClick={handleClose}
                disabled={pendingCount > 0}
                className={`w-full btn-secondary button-press-feedback ${
                  pendingCount > 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                variant="outline"
              >
                {pendingCount > 0 ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin"><RefreshCw className="w-4 h-4" /></div>
                    {LABELS.FOLDERS.SYNC_WAIT}
                  </span>
                ) : (
                  LABELS.BUTTONS.CLOSE
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
