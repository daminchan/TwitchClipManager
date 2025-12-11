// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション10.2: サーバー/クライアントコンポーネント分離
// - オンボーディングフロー設計.md: オンボーディングモーダル統合

'use client';

import { useState, useTransition } from 'react';
import { X } from 'lucide-react';

import { AuthStep } from './auth-step';
import { GameSelectionStep } from './game-selection-step';
import { StreamerSelectionStep } from './streamer-selection-step';
import { CompletionStep } from './completion-step';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { addMultipleFavoriteStreamers } from '@/actions/favorites';
import { LABELS } from '@/lib/constants';
import type { RecommendedStreamer } from '@/types/twitch';

type OnboardingStep = 'auth' | 'game' | 'streamer' | 'completion';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  skipAuth?: boolean; // 認証をスキップするか（trueならゲーム選択から開始）
}

export function OnboardingModal({ isOpen, onClose, skipAuth = false }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(
    skipAuth ? 'game' : 'auth' // 認証をスキップするならゲーム選択から、しないなら認証から開始
  );
  const [selectedGameId, setSelectedGameId] = useState('');
  const [selectedGameName, setSelectedGameName] = useState('');
  const [selectedStreamers, setSelectedStreamers] = useState<RecommendedStreamer[]>([]);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleAuthSuccess = async () => {
    // 認証成功後、既存ユーザーかどうかをチェック
    startTransition(async () => {
      try {
        const response = await fetch('/api/favorites');
        if (response.ok) {
          const { data } = await response.json();

          // お気に入り配信者がいる場合は既存ユーザー → モーダルを閉じる
          if (data && data.length > 0) {
            onClose();
            window.location.reload(); // クリップを表示するためリロード
            return;
          }
        }
      } catch (error) {
        console.error('Failed to check favorites:', error);
      }

      // お気に入り配信者がいない場合は新規ユーザー → ゲーム選択へ
      setCurrentStep('game');
    });
  };

  const handleGameNext = (gameId: string, gameName: string) => {
    setSelectedGameId(gameId);
    setSelectedGameName(gameName);
    setCurrentStep('streamer');
  };

  const handleStreamerNext = (streamers: RecommendedStreamer[]) => {
    setSelectedStreamers(streamers);

    // お気に入り配信者を一括追加
    startTransition(async () => {
      const result = await addMultipleFavoriteStreamers(
        streamers.map((s) => ({
          streamerId: s.userId,
          streamerName: s.userName,
          streamerLogin: s.userLogin,
          streamerImage: s.profileImageUrl,
        }))
      );

      if (result.success) {
        setCurrentStep('completion');
      } else {
        console.error('Failed to add favorite streamers:', result.message);
        // エラー処理（必要に応じてトースト表示等）
      }
    });
  };

  const handleComplete = () => {
    onClose();
    // ページリロードでクリップを表示
    window.location.reload();
  };

  const handleBack = () => {
    if (currentStep === 'streamer') {
      setCurrentStep('game');
    } else if (currentStep === 'game' && !skipAuth) {
      setCurrentStep('auth');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-300">
      {/* 背景オーバーレイ */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" />

      {/* モーダルコンテンツ */}
      <div className="relative w-full max-w-4xl h-[95vh] sm:h-[90vh] bg-[#0f0f0f] rounded-lg shadow-2xl border border-gray-800 flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* ヘッダー（閉じるボタン） */}
        {currentStep !== 'auth' && (
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-[#1a1a1a] hover:bg-[#2a2a2a] transition-colors"
              aria-label="閉じる"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        )}

        {/* ステップインジケーター */}
        {currentStep !== 'auth' && currentStep !== 'completion' && (
          <div className="px-4 sm:px-8 pt-6 sm:pt-8 pb-3 sm:pb-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-center gap-2">
              {/* ステップ1: ゲーム選択 */}
              <div
                className={`flex items-center transition-all duration-300 ${
                  currentStep === 'game' ? 'text-purple-400 scale-105' : 'text-gray-500 scale-100'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    currentStep === 'game'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  1
                </div>
                <span className="ml-2 text-sm font-medium hidden sm:inline">
                  ゲーム選択
                </span>
              </div>

              {/* 区切り線 */}
              <div className={`w-12 h-0.5 transition-colors duration-300 ${
                currentStep === 'streamer' ? 'bg-purple-600' : 'bg-gray-700'
              }`} />

              {/* ステップ2: 配信者選択 */}
              <div
                className={`flex items-center transition-all duration-300 ${
                  currentStep === 'streamer' ? 'text-purple-400 scale-105' : 'text-gray-500 scale-100'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    currentStep === 'streamer'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  2
                </div>
                <span className="ml-2 text-sm font-medium hidden sm:inline">
                  配信者選択
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ステップコンテンツ */}
        <div className="flex-1 overflow-hidden px-4 sm:px-8 pb-4 sm:pb-8">
          {currentStep === 'auth' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full">
              <AuthStep onSuccess={handleAuthSuccess} />
            </div>
          )}

          {currentStep === 'game' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full">
              <GameSelectionStep
                onNext={handleGameNext}
                onBack={!skipAuth ? handleBack : undefined}
              />
            </div>
          )}

          {currentStep === 'streamer' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full">
              <StreamerSelectionStep
                gameId={selectedGameId}
                gameName={selectedGameName}
                onNext={handleStreamerNext}
                onBack={handleBack}
              />
            </div>
          )}

          {currentStep === 'completion' && (
            <div className="animate-in fade-in zoom-in-95 duration-500 h-full">
              <CompletionStep
                streamerCount={selectedStreamers.length}
                onComplete={handleComplete}
              />
            </div>
          )}
        </div>

        {/* ローディングオーバーレイ */}
        {isPending && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg animate-in fade-in duration-200">
            <div className="animate-in zoom-in-95 duration-300">
              <LoadingSpinner size="lg" text={LABELS.MESSAGES.ADDING_FAVORITES} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
