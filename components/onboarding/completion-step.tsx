// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - オンボーディングフロー設計.md: 完了ステップ

'use client';

import { CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CompletionStepProps {
  streamerCount: number;
  onComplete: () => void;
}

export function CompletionStep({ streamerCount, onComplete }: CompletionStepProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center relative overflow-hidden">
      {/* 背景アニメーション */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* コンテンツ */}
      <div className="relative z-10">
        {/* 成功アイコン */}
        <div className="mb-8 relative animate-in zoom-in-0 duration-700">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-2xl animate-pulse"></div>
          <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 rounded-full p-8 shadow-2xl shadow-purple-500/50">
            <CheckCircle className="w-20 h-20 text-white" strokeWidth={2.5} />
          </div>
          {/* 装飾スパークル */}
          <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-pulse" />
          <Sparkles className="absolute -bottom-2 -left-2 w-6 h-6 text-purple-400 animate-pulse delay-300" />
        </div>

        {/* タイトル */}
        <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 bg-[length:200%_auto] animate-gradient">
          準備完了
        </h2>

        {/* サブタイトル */}
        <p className="text-lg text-gray-300 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          {streamerCount}人の配信者をお気に入りに追加しました
        </p>
        <p className="text-sm text-gray-500 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          さっそくお気に入り配信者のクリップを楽しみましょう
        </p>

        {/* 完了ボタン */}
        <Button
          onClick={onComplete}
          className="group relative bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-[length:200%_auto] hover:bg-[position:100%_0] text-white px-10 py-7 text-lg font-semibold rounded-xl transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 animate-in zoom-in-95 duration-700 delay-500 overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-2">
            <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
            クリップを見る
            <Sparkles className="w-5 h-5 group-hover:-rotate-12 transition-transform duration-300" />
          </span>
          {/* ホバーエフェクト */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
        </Button>
      </div>
    </div>
  );
}
