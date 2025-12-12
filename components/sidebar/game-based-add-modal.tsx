// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション10.2: サーバー/クライアントコンポーネント分離

'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

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

  if (!isOpen) return null;

  const handleGameNext = (games: TwitchGame[]) => {
    setSelectedGames(games);
    setStep('streamer');
  };

  const handleStreamerNext = async (streamers: RecommendedStreamer[]) => {
    // 即座にモーダルを閉じる（楽観的UI）
    handleClose();

    try {
      const result = await onAddStreamers(streamers);
      // 成功メッセージは親コンポーネントのtoastで表示される想定
      // エラーの場合のみここでハンドリング
      if (!result.success) {
        console.error('Failed to add streamers:', result.message);
      }
    } catch (error) {
      console.error('Failed to add streamers:', error);
    }
  };

  const handleBack = () => {
    setStep('game');
  };

  const handleClose = () => {
    setStep('game');
    setSelectedGames([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        className="relative w-full max-w-5xl max-h-[90vh] bg-[#0f0f0f] rounded-lg overflow-hidden shadow-2xl border border-[#2a2a2a]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 閉じるボタン */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
          aria-label="閉じる"
        >
          <X className="w-6 h-6" />
        </button>

        {/* コンテンツ */}
        <div className="p-8 h-[80vh] overflow-y-auto">
          {step === 'game' ? (
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
  );
}
