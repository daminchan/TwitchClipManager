// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション10.2: サーバー/クライアントコンポーネント分離

'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { MultiGameSelectionStep } from './multi-game-selection-step';
import { MultiStreamerSelectionStep } from './multi-streamer-selection-step';
import type { TwitchGame, RecommendedStreamer } from '@/types/twitch';

type Step = 'game' | 'streamer';

interface GameBasedAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStreamers: (streamers: RecommendedStreamer[]) => Promise<{ success: boolean; message: string }>;
}

export function GameBasedAddModal({ isOpen, onClose, onAddStreamers }: GameBasedAddModalProps) {
  const [step, setStep] = useState<Step>('game');
  const [selectedGames, setSelectedGames] = useState<TwitchGame[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  if (!isOpen) return null;

  const handleGameNext = (games: TwitchGame[]) => {
    setSelectedGames(games);
    setStep('streamer');
  };

  const handleStreamerNext = async (streamers: RecommendedStreamer[]) => {
    setIsAdding(true);
    try {
      const result = await onAddStreamers(streamers);
      // 成功したらtoast表示してモーダルを閉じる
      showToast(result.message, 'success');
      setTimeout(() => {
        handleClose();
      }, 1000); // toast表示後にモーダルを閉じる
    } catch (error) {
      console.error('Failed to add streamers:', error);
      showToast(
        error instanceof Error ? error.message : 'お気に入りの追加に失敗しました',
        'error'
      );
      setIsAdding(false);
    }
  };

  const handleBack = () => {
    setStep('game');
  };

  const handleClose = () => {
    setStep('game');
    setSelectedGames([]);
    setIsAdding(false);
    hideToast();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div
          className="relative w-full max-w-5xl max-h-[90vh] bg-[#0f0f0f] rounded-lg overflow-hidden shadow-2xl border border-[#2a2a2a]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 閉じるボタン */}
          <button
            onClick={handleClose}
            disabled={isAdding}
            className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="閉じる"
          >
            <X className="w-6 h-6" />
          </button>

          {/* コンテンツ */}
          <div className="p-8 h-[80vh] overflow-y-auto">
            {isAdding ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-400 text-lg">お気に入りに追加中...</p>
              </div>
            ) : step === 'game' ? (
              <MultiGameSelectionStep onNext={handleGameNext} onCancel={handleClose} />
            ) : (
              <MultiStreamerSelectionStep
                selectedGames={selectedGames}
                onNext={handleStreamerNext}
                onBack={handleBack}
              />
            )}
          </div>
        </div>
      </div>

      {/* Toast通知 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </>
  );
}
