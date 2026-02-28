'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

import { MultiGameSelectionStep } from './multi-game-selection-step';
import { MultiStreamerSelectionStep } from './multi-streamer-selection-step';
import { modalOverlay, modalContent } from '@/lib/animations';
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

  const handleGameNext = (games: TwitchGame[]) => {
    setSelectedGames(games);
    setStep('streamer');
  };

  const handleStreamerNext = async (streamers: RecommendedStreamer[]) => {
    setIsAdding(true);

    try {
      const result = await onAddStreamers(streamers);
      if (result.success) {
        // 追加完了後にモーダルを閉じる
        handleClose();
      } else {

        setIsAdding(false);
      }
    } catch (error) {

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
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          variants={modalOverlay}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div
            className="modal-container-xl sm:max-h-[90vh]"
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 閉じるボタン（追加中は非表示） */}
            {!isAdding && (
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                aria-label="閉じる"
              >
                <X className="w-6 h-6" />
              </button>
            )}

            {/* コンテンツ */}
            <div className="p-4 sm:p-8 h-[85vh] sm:h-[80vh] overflow-y-auto">
              {step === 'game' ? (
                <MultiGameSelectionStep onNext={handleGameNext} onCancel={handleClose} />
              ) : (
                <MultiStreamerSelectionStep
                  selectedGames={selectedGames}
                  onNext={handleStreamerNext}
                  onBack={handleBack}
                  isAdding={isAdding}
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
