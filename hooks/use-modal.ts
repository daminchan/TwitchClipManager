/**
 * モーダル制御用カスタムフック
 *
 * 適用ルール:
 * - セクション14.2: カスタムフック（複雑なロジック分離）
 *
 * 機能:
 * - モーダルの開閉状態管理
 * - ESCキーでモーダルを閉じる
 * - モーダル表示中のスクロール無効化
 */

import { useState, useEffect, useCallback } from 'react';

interface UseModalOptions {
  /** 初期表示状態 */
  initialOpen?: boolean;
  /** モーダルを閉じる際のコールバック */
  onClose?: () => void;
}

interface UseModalReturn {
  /** モーダルが開いているか */
  isOpen: boolean;
  /** モーダルを開く */
  openModal: () => void;
  /** モーダルを閉じる */
  closeModal: () => void;
  /** モーダルの開閉を切り替え */
  toggleModal: () => void;
}

/**
 * モーダルの開閉を管理するカスタムフック
 * ESCキーでの閉じる機能とスクロール無効化を自動で処理
 *
 * @example
 * const { isOpen, openModal, closeModal } = useModal();
 *
 * return (
 *   <>
 *     <button onClick={openModal}>Open</button>
 *     {isOpen && <Modal onClose={closeModal} />}
 *   </>
 * );
 */
export function useModal({
  initialOpen = false,
  onClose,
}: UseModalOptions = {}): UseModalReturn {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const toggleModal = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // ESCキーでモーダルを閉じる & スクロール無効化
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeModal();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeModal]);

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
  };
}
