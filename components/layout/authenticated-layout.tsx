// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション10.2: サーバー/クライアントコンポーネント分離
// - YouTube風永続レイアウト
// - @dnd-kit を使用したドラッグ&ドロップ

'use client';

import { useState, createContext, useContext } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import Image from 'next/image';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { Toast } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { useFavoriteActions } from '@/hooks/use-favorite-actions';
import { addStreamerToFolder } from '@/actions/folders';

import type { TwitchChannel } from '@/types/twitch';
import type { FavoriteStreamer } from '@/types/database';

// フォルダ選択状態を共有するためのContext
interface FolderContextType {
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
}

const FolderContext = createContext<FolderContextType | undefined>(undefined);

export function useFolderContext() {
  const context = useContext(FolderContext);
  if (!context) {
    throw new Error('useFolderContext must be used within AuthenticatedLayout');
  }
  return context;
}

// ドラッグ状態を共有するためのContext
interface DragContextType {
  isDragging: boolean;
  activeStreamer: FavoriteStreamer | null;
}

const DragContext = createContext<DragContextType | undefined>(undefined);

export function useDragContext() {
  const context = useContext(DragContext);
  if (!context) {
    throw new Error('useDragContext must be used within AuthenticatedLayout');
  }
  return context;
}

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const queryClient = useQueryClient();
  const { toast, showToast, hideToast } = useToast();
  const { handleAddFavorite: addFavorite } = useFavoriteActions();

  // サイドバー制御
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // フォルダ選択状態
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // ドラッグ&ドロップ状態
  const [isDragging, setIsDragging] = useState(false);
  const [activeStreamer, setActiveStreamer] = useState<FavoriteStreamer | null>(null);

  // お気に入り配信者を追加
  const handleAddFavorite = async (streamer: TwitchChannel) => {
    await addFavorite(
      streamer,
      (message) => showToast(message, 'success'),
      (message, type) => showToast(message, type)
    );
  };

  // お気に入り配信者を削除したときのハンドラー
  const handleRemoveFavorite = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['clips', 'favorites'],
      refetchType: 'active'
    });
    await queryClient.invalidateQueries({ queryKey: ['favorites'] });
  };

  // フォルダクリック時のハンドラー
  const handleFolderClick = (folderId: string) => {
    if (selectedFolderId === folderId) {
      // 同じフォルダをクリック → 解除（全クリップ表示に戻す）
      setSelectedFolderId(null);
    } else {
      setSelectedFolderId(folderId);
    }
  };

  // ドラッグ開始
  const handleDragStart = (event: DragStartEvent) => {
    const streamer = event.active.data.current?.streamer as FavoriteStreamer;
    setActiveStreamer(streamer);
    setIsDragging(true);
  };

  // ドラッグ終了
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setIsDragging(false);
    setActiveStreamer(null);

    // フォルダにドロップされた場合
    if (over && over.data.current?.type === 'folder') {
      const streamer = active.data.current?.streamer as FavoriteStreamer;
      const folderId = over.id as string;

      // 楽観的UI: 即座にキャッシュを更新
      queryClient.setQueryData(['folders'], (oldData: any) => {
        if (!oldData?.data) return oldData;

        return {
          ...oldData,
          data: oldData.data.map((f: any) => {
            if (f.id === folderId) {
              // このフォルダに配信者を追加
              const newStreamer = {
                id: `temp-${Date.now()}`,
                folderId: folderId,
                streamerId: streamer.streamerId,
                streamerName: streamer.streamerName,
                streamerLogin: streamer.streamerLogin,
                streamerImage: streamer.streamerImage,
                addedAt: new Date().toISOString(),
              };

              return {
                ...f,
                folderStreamers: [...(f.folderStreamers || []), newStreamer],
              };
            }
            return f;
          }),
        };
      });

      // バックグラウンドでサーバーアクション実行
      try {
        const result = await addStreamerToFolder(folderId, {
          streamerId: streamer.streamerId,
          streamerName: streamer.streamerName,
          streamerLogin: streamer.streamerLogin,
          streamerImage: streamer.streamerImage,
        });

        if (result.success) {
          showToast('フォルダに配信者を追加しました', 'success');
          // 実データで上書き
          await queryClient.invalidateQueries({ queryKey: ['folders'] });
        } else {
          // エラー時はロールバック
          await queryClient.invalidateQueries({ queryKey: ['folders'] });
          showToast(result.message, 'error');
        }
      } catch (error) {
        console.error('Add to folder error:', error);
        // エラー時はロールバック
        await queryClient.invalidateQueries({ queryKey: ['folders'] });
        showToast('フォルダへの追加に失敗しました', 'error');
      }
    }
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <FolderContext.Provider value={{ selectedFolderId, setSelectedFolderId }}>
        <DragContext.Provider value={{ isDragging, activeStreamer }}>
          <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
            {/* 固定ヘッダー */}
            <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

            <div className="flex flex-1 overflow-hidden">
              {/* 固定サイドバー */}
              <DashboardSidebar
                isSidebarOpen={isSidebarOpen}
                onAddFavorite={handleAddFavorite}
                onRemoveFavorite={handleRemoveFavorite}
                selectedFolderId={selectedFolderId}
                onFolderClick={handleFolderClick}
                isDragging={isDragging}
              />

              {/* メインコンテンツ（ページごとに切り替わる） */}
              <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#0f0f0f] to-[#1a1a1a]">
                {children}
              </main>
            </div>

            {/* モバイルフッターナビゲーション */}
            <MobileNav />

            {/* トースト通知 */}
            {toast && (
              <Toast
                message={toast.message}
                type={toast.type}
                onClose={hideToast}
              />
            )}

            {/* ドラッグオーバーレイ */}
            <DragOverlay>
              {activeStreamer && (
                <div className="group bg-[#1a1a1a] hover:bg-[#222222] rounded-lg p-4 cursor-move transition-all duration-200 shadow-2xl scale-105 rotate-3">
                  {/* プロフィール画像 */}
                  <div className="relative w-24 h-24 mx-auto mb-3">
                    {activeStreamer.streamerImage ? (
                      <Image
                        src={activeStreamer.streamerImage}
                        alt={activeStreamer.streamerName}
                        fill
                        className="rounded-full object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-purple-600 flex items-center justify-center">
                        <span className="text-2xl text-white font-bold">
                          {activeStreamer.streamerName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 配信者名 */}
                  <p className="text-center text-sm font-semibold text-gray-100 line-clamp-1 mb-1">
                    {activeStreamer.streamerName}
                  </p>
                  <p className="text-center text-xs text-gray-400 line-clamp-1">
                    @{activeStreamer.streamerLogin}
                  </p>
                </div>
              )}
            </DragOverlay>
          </div>
        </DragContext.Provider>
      </FolderContext.Provider>
    </DndContext>
  );
}
