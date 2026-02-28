'use client';

import { createPortal } from 'react-dom';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus } from 'lucide-react';

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
          {/* アイコン */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-[#ebe5dc] flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-[#8a8078]" />
            </div>
          </div>

          {/* タイトル */}
          <h2 className="text-2xl font-bold text-[#44403c] mb-3">
            {LABELS.REGISTRATION.TITLE}
          </h2>

          {/* 説明 */}
          <p className="text-[#a09890] text-sm mb-8 leading-relaxed">
            {LABELS.REGISTRATION.DESCRIPTION}
          </p>

          {/* CTAボタン */}
          <Link href={ROUTES.LOGIN} onClick={onClose}>
            <Button className="w-full py-6 text-lg font-bold btn-primary rounded-xl button-press-feedback">
              {LABELS.REGISTRATION.CTA}
            </Button>
          </Link>

          {/* キャンセル */}
          <button
            onClick={onClose}
            className="mt-4 text-sm text-[#a09890] hover:text-[#6b655c] transition-colors"
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
