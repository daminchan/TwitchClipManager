// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション8.2: Props型定義

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { User, Edit3, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { updateDisplayName } from '@/actions/user';
import { validateDisplayName } from '@/lib/validations/user';
import { LABELS } from '@/lib/constants';

interface DisplayNameSectionProps {
  currentName: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function DisplayNameSection({ currentName, onSuccess, onError }: DisplayNameSectionProps) {
  const router = useRouter();
  const { update } = useSession();
  const [name, setName] = useState(currentName);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // クライアント側バリデーション
    const validation = validateDisplayName(name);
    if (!validation.success) {
      onError(validation.error!);
      return;
    }

    if (name.trim() === currentName) {
      onError('変更する名前が現在と同じです');
      return;
    }

    // サーバーアクション実行
    startTransition(async () => {
      const result = await updateDisplayName(name.trim());

      if (result.success) {
        onSuccess(result.message);
        // クライアント側のセッションキャッシュを更新
        await update();
        // サーバーコンポーネントを更新
        router.refresh();
      } else {
        onError(result.message);
      }
    });
  };

  return (
    <Card className="bg-[#1a1a1a] border border-gray-800 hover:border-gray-700 transition-all duration-300 shadow-lg hover:shadow-purple-500/10">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-600/10 rounded-lg">
            <Edit3 className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <CardTitle className="text-gray-100 flex items-center gap-2">
              {LABELS.SECTIONS.DISPLAY_NAME_CHANGE}
            </CardTitle>
            <CardDescription className="text-gray-400 text-sm mt-1">
              アカウントの表示名を変更できます
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              {LABELS.FORM.DISPLAY_NAME}
            </label>
            <div className="relative">
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
                className="bg-[#0f0f0f] border border-gray-800 text-gray-100 focus:border-purple-500 transition-colors pr-10"
                placeholder={LABELS.PLACEHOLDERS.NAME}
              />
              {name.trim() !== currentName && name.trim() !== '' && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Check className="w-4 h-4 text-green-500" />
                </div>
              )}
            </div>
            {currentName && (
              <p className="text-xs text-gray-500">
                現在: <span className="text-gray-400">{currentName}</span>
              </p>
            )}
          </div>
          <Button
            type="submit"
            disabled={isPending || name.trim() === currentName}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:shadow-none transition-all duration-300"
          >
            {isPending ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {LABELS.BUTTONS.UPDATING}
              </div>
            ) : (
              LABELS.BUTTONS.UPDATE_DISPLAY_NAME
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
