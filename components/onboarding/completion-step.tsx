// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - オンボーディングフロー設計.md: 完了ステップ

'use client';

import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CompletionStepProps {
  streamerCount: number;
  onComplete: () => void;
}

export function CompletionStep({ streamerCount, onComplete }: CompletionStepProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      {/* 成功アイコン */}
      <div className="mb-6 animate-in zoom-in-0 duration-500">
        <CheckCircle className="w-24 h-24 text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
      </div>

      {/* メッセージ */}
      <h2 className="text-3xl font-bold text-gray-100 mb-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        セットアップ完了！
      </h2>
      <p className="text-gray-400 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
        {streamerCount}人の配信者をお気に入りに追加しました
      </p>
      <p className="text-sm text-gray-500 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
        さっそくお気に入り配信者のクリップを楽しみましょう
      </p>

      {/* 完了ボタン */}
      <Button
        onClick={onComplete}
        className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/50 animate-in zoom-in-95 duration-500 delay-500"
      >
        クリップを見る
      </Button>
    </div>
  );
}
