// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション8.2: Props型定義

'use client';

import { useState, useTransition, useEffect } from 'react';
import { X, Trash2, Users, UserPlus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { removeStreamerFromFolder } from '@/actions/folders';
import { ROUTES } from '@/lib/constants';
import type { Folder, FolderStreamer } from '@/types/database';

interface FolderStreamersModalProps {
  isOpen: boolean;
  folder: Folder | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function FolderStreamersModal({ isOpen, folder, onClose, onSuccess }: FolderStreamersModalProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [localStreamers, setLocalStreamers] = useState<FolderStreamer[]>([]);

  // folderが変更されたらローカルステートを更新（楽観的更新用）
  useEffect(() => {
    if (folder?.folderStreamers) {
      setLocalStreamers(folder.folderStreamers);
    }
  }, [folder]);

  if (!isOpen || !folder) return null;

  const handleRemoveStreamer = async (streamerId: string) => {
    setDeletingId(streamerId);

    // 楽観的更新：即座にUIから削除
    const updatedStreamers = localStreamers.filter(s => s.streamerId !== streamerId);
    setLocalStreamers(updatedStreamers);

    startTransition(async () => {
      const result = await removeStreamerFromFolder(folder.id, streamerId);

      if (result.success) {
        onSuccess();
        // フォルダが空になったら閉じる
        if (updatedStreamers.length === 0) {
          onClose();
        }
      } else {
        // エラー時は元に戻す
        setLocalStreamers(folder.folderStreamers || []);
        alert(result.message);
      }

      setDeletingId(null);
    });
  };

  const handleClose = () => {
    if (!isPending) {
      onClose();
    }
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
              <p className="text-sm text-gray-400">
                {localStreamers.length}人の配信者
              </p>
            </div>
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
              {localStreamers.map((streamer) => (
                <div
                  key={streamer.id}
                  className="group bg-[#1a1a1a] hover:bg-[#222222] rounded-lg p-4 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
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

                    {/* 削除ボタン */}
                    <button
                      onClick={() => handleRemoveStreamer(streamer.streamerId)}
                      disabled={deletingId === streamer.streamerId}
                      className="p-2 hover:bg-red-900/30 rounded transition-colors button-press-feedback opacity-0 group-hover:opacity-100"
                      aria-label="フォルダから削除"
                    >
                      {deletingId === streamer.streamerId ? (
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="p-6 border-t border-[#2a2a2a] space-y-3">
          <Link href={ROUTES.FAVORITES} className="block">
            <Button
              className="w-full button-press-feedback bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              配信者を追加
            </Button>
          </Link>
          <Button
            onClick={handleClose}
            disabled={isPending}
            className="w-full button-press-feedback"
            variant="outline"
          >
            閉じる
          </Button>
        </div>
      </div>
    </div>
  );
}
