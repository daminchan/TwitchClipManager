// - YouTube風永続レイアウト
// - @dnd-kit を使用したドラッグ&ドロップ

'use client';

import { useState, useRef, useCallback, createContext, useContext, useMemo } from 'react';
import Image from 'next/image';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  DndContext,
  DragOverlay,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent
} from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { Toast } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { useFavoriteActions } from '@/hooks/use-favorite-actions';
import { addStreamerToFolder } from '@/actions/folders';
import { scaleIn } from '@/lib/animations';
import { API_ENDPOINTS, CACHE_TIME } from '@/lib/constants';
import type { Folder, FavoriteStreamer } from '@/types/database';
import type { TwitchChannel } from '@/types/twitch';

// フォルダ選択状態を共有するためのContext
interface FolderContextType {
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
  onFolderIdResolved?: (tempId: string, realId: string) => void;
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
  pendingAdditions: Set<string>; // "folderId:streamerId" 形式で追加中の配信者を追跡
}

const DragContext = createContext<DragContextType | undefined>(undefined);

export function useDragContext() {
  const context = useContext(DragContext);
  if (!context) {
    throw new Error('useDragContext must be used within AuthenticatedLayout');
  }
  return context;
}

// temp-フォルダへのD&Dをキューに保存する型
interface QueuedDrop {
  tempFolderId: string;
  streamer: FavoriteStreamer;
}

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const queryClient = useQueryClient();
  const { toast, showToast, hideToast } = useToast();
  const { handleAddFavorite: addFavorite } = useFavoriteActions();

  // ドラッグ&ドロップセンサー設定
  // タッチデバイスでは長押し（250ms）でドラッグ開始、スワイプと区別
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10, // 10px移動でドラッグ開始
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,      // 250ms長押しでドラッグ開始
      tolerance: 5,    // 5px以内の移動は許容
    },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  // サイドバー制御
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // フォルダ選択状態
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // ドラッグ&ドロップ状態
  const [isDragging, setIsDragging] = useState(false);
  const [activeStreamer, setActiveStreamer] = useState<FavoriteStreamer | null>(null);
  const [pendingAdditions, setPendingAdditions] = useState<Set<string>>(new Set());

  // temp-フォルダへのD&Dキュー
  const dropQueueRef = useRef<QueuedDrop[]>([]);

  // お気に入り配信者のIDリストを抽出（キャッシュを監視）
  // FavoriteListコンポーネントがqueryFnを定義・実行するので、ここでは同じqueryFnを使用
  const { data: favoritesData } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const response = await fetch(API_ENDPOINTS.FAVORITES, {
        method: 'GET',
        credentials: 'include',
      });
      if (!response.ok) return [];
      const result = await response.json();
      return result.data as FavoriteStreamer[];
    },
    staleTime: CACHE_TIME.DEFAULT_STALE_TIME,
    enabled: isAuthenticated,
  });

  const favoriteStreamerIds = useMemo(() => {
    if (!favoritesData || !Array.isArray(favoritesData)) return [];
    return favoritesData.map((f) => f.streamerId);
  }, [favoritesData]);

  // temp-フォルダIDが実IDに解決された時のハンドラー
  const handleFolderIdResolved = useCallback(async (tempId: string, realId: string) => {
    // キューからtemp-フォルダ宛のドロップを取り出す
    const queued = dropQueueRef.current.filter((q) => q.tempFolderId === tempId);
    dropQueueRef.current = dropQueueRef.current.filter((q) => q.tempFolderId !== tempId);

    // 楽観的キャッシュのtemp-IDをreal-IDに更新（invalidateで上書きされるが先にマッピング）
    for (const item of queued) {
      const pendingKey = `${realId}:${item.streamer.streamerId}`;
      setPendingAdditions((prev) => new Set(prev).add(pendingKey));

      try {
        const result = await addStreamerToFolder(realId, {
          streamerId: item.streamer.streamerId,
          streamerName: item.streamer.streamerName,
          streamerLogin: item.streamer.streamerLogin,
          streamerImage: item.streamer.streamerImage,
        });

        if (!result.success) {
          showToast(result.message, 'error');
        }
      } catch {
        showToast('フォルダへの追加に失敗しました', 'error');
      } finally {
        setPendingAdditions((prev) => {
          const newSet = new Set(prev);
          newSet.delete(pendingKey);
          return newSet;
        });
      }
    }

    // 実データで上書き
    if (queued.length > 0) {
      await queryClient.invalidateQueries({ queryKey: ['folders'] });
    }
  }, [queryClient, showToast]);

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
      const pendingKey = `${folderId}:${streamer.streamerId}`;

      // 作成中フォルダの場合はキューに保存して楽観的UI更新
      if (folderId.startsWith('temp-')) {
        dropQueueRef.current.push({ tempFolderId: folderId, streamer });

        // 楽観的UI: 即座にキャッシュを更新（見た目上は追加済み）
        queryClient.setQueryData<{ data: Folder[] }>(['folders'], (oldData) => {
          if (!oldData?.data) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((f) => {
              if (f.id === folderId) {
                const newStreamer = {
                  id: `temp-${Date.now()}`,
                  folderId,
                  streamerId: streamer.streamerId,
                  streamerName: streamer.streamerName,
                  streamerLogin: streamer.streamerLogin,
                  streamerImage: streamer.streamerImage,
                  addedAt: new Date().toISOString(),
                };
                return { ...f, folderStreamers: [...(f.folderStreamers || []), newStreamer] };
              }
              return f;
            }),
          };
        });
        return;
      }

      // 追加中かチェック
      if (pendingAdditions.has(pendingKey)) {
        showToast('この配信者は追加処理中です', 'error');
        return;
      }

      // 既に存在するかチェック（キャッシュから）
      const foldersData = queryClient.getQueryData<{ data: Folder[] }>(['folders']);
      if (foldersData?.data) {
        const targetFolder = foldersData.data.find((f) => f.id === folderId);
        if (targetFolder?.folderStreamers?.some((fs) => fs.streamerId === streamer.streamerId)) {
          showToast('この配信者は既にこのフォルダに追加されています', 'error');
          return;
        }
      }

      // 追加中としてマーク
      setPendingAdditions(prev => new Set(prev).add(pendingKey));

      // 楽観的UI: 即座にキャッシュを更新
      queryClient.setQueryData<{ data: Folder[] }>(['folders'], (oldData) => {
        if (!oldData?.data) return oldData;

        return {
          ...oldData,
          data: oldData.data.map((f) => {
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
          // 実データで上書き（トースト表示はなし - 連続追加時にうるさくなるため）
          await queryClient.invalidateQueries({ queryKey: ['folders'] });
        } else {
          // エラー時はロールバック
          await queryClient.invalidateQueries({ queryKey: ['folders'] });
          showToast(result.message, 'error');
        }
      } catch (error) {

        // エラー時はロールバック
        await queryClient.invalidateQueries({ queryKey: ['folders'] });
        showToast('フォルダへの追加に失敗しました', 'error');
      } finally {
        // 追加中フラグを解除
        setPendingAdditions(prev => {
          const newSet = new Set(prev);
          newSet.delete(pendingKey);
          return newSet;
        });
      }
    }
  };

  // Context値をメモ化してConsumerの不要な再レンダリングを防止
  const folderContextValue = useMemo(
    () => ({ selectedFolderId, setSelectedFolderId, onFolderIdResolved: handleFolderIdResolved }),
    [selectedFolderId, setSelectedFolderId, handleFolderIdResolved]
  );

  const dragContextValue = useMemo(
    () => ({ isDragging, activeStreamer, pendingAdditions }),
    [isDragging, activeStreamer, pendingAdditions]
  );

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <FolderContext.Provider value={folderContextValue}>
        <DragContext.Provider value={dragContextValue}>
          <div className="h-screen bg-[#f2ede6] flex flex-col overflow-hidden">
            {/* 固定ヘッダー */}
            <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

            <div className="flex flex-1 overflow-hidden">
              {/* 固定サイドバー */}
              <DashboardSidebar
                isSidebarOpen={isSidebarOpen}
                isAuthenticated={isAuthenticated}
                onAddFavorite={isAuthenticated ? handleAddFavorite : undefined}
                onRemoveFavorite={isAuthenticated ? handleRemoveFavorite : undefined}
                favoriteStreamerIds={favoriteStreamerIds}
              />

              {/* メインコンテンツ（ページごとに切り替わる） */}
              <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#ece6dd] to-[#f2ede6]">
                {children}
              </main>
            </div>

            {/* モバイルフッターナビゲーション */}
            <MobileNav />

            {/* トースト通知 */}
            {toast ? (
              <Toast
                message={toast.message}
                type={toast.type}
                onClose={hideToast}
              />
            ) : null}

            {/* ドラッグオーバーレイ */}
            <DragOverlay>
              {activeStreamer ? (
                <motion.div
                  className="group bg-[#faf8f5] hover:bg-[#ebe5dc] rounded-lg p-2 cursor-move transition-all duration-200 shadow-2xl scale-50 rotate-3"
                  variants={scaleIn}
                  initial="hidden"
                  animate="visible"
                >
                  {/* プロフィール画像 */}
                  <div className="relative w-12 h-12 mx-auto mb-1">
                    {activeStreamer.streamerImage ? (
                      <Image
                        src={activeStreamer.streamerImage}
                        alt={activeStreamer.streamerName}
                        fill
                        className="rounded-full object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-[#a09890] flex items-center justify-center">
                        <span className="text-sm text-white font-bold">
                          {activeStreamer.streamerName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 配信者名 */}
                  <p className="text-center text-xs font-semibold text-[#44403c] line-clamp-1 mb-0.5">
                    {activeStreamer.streamerName}
                  </p>
                  <p className="text-center text-[10px] text-[#a09890] line-clamp-1">
                    @{activeStreamer.streamerLogin}
                  </p>
                </motion.div>
              ) : null}
            </DragOverlay>
          </div>
        </DragContext.Provider>
      </FolderContext.Provider>
    </DndContext>
  );
}
