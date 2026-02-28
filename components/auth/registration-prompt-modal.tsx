'use client';

import { createPortal } from 'react-dom';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Star, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useIsMounted } from '@/hooks/use-is-mounted';
import { modalOverlay, modalContent } from '@/lib/animations';
import { LABELS, ROUTES } from '@/lib/constants';

interface RegistrationPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RegistrationPromptModal({ isOpen, onClose }: RegistrationPromptModalProps) {
  const isMounted = useIsMounted();

  if (!isMounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div className="modal-overlay" onClick={onClose} variants={modalOverlay} initial="hidden" animate="visible" exit="exit">
          <motion.div className="modal-container-sm" onClick={(e) => e.stopPropagation()} variants={modalContent} initial="hidden" animate="visible" exit="exit" role="dialog" aria-modal="true" aria-label={LABELS.REGISTRATION.TITLE}>
        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 modal-close-btn button-press-feedback"
          aria-label={LABELS.BUTTONS.CLOSE}
        >
          <X className="w-5 h-5" />
        </button>

        {/* コンテンツ */}
        <div className="p-8 text-center">
          {/* アイコンデコレーション */}
          <div className="flex justify-center items-center gap-2 mb-6">
            <Star className="w-6 h-6 text-yellow-400" />
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Heart className="w-8 h-8 text-white fill-white" />
            </div>
            <Sparkles className="w-6 h-6 text-purple-400" />
          </div>

          {/* タイトル */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {LABELS.REGISTRATION.TITLE}
          </h2>

          {/* 説明 */}
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            {LABELS.REGISTRATION.DESCRIPTION}
          </p>

          {/* CTAボタン */}
          <Link href={ROUTES.LOGIN} onClick={onClose}>
            <Button className="w-full py-6 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl button-press-feedback">
              {LABELS.REGISTRATION.CTA}
            </Button>
          </Link>

          {/* キャンセル */}
          <button
            onClick={onClose}
            className="mt-4 text-sm text-gray-500 hover:text-gray-600 transition-colors"
          >
            あとで
          </button>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
