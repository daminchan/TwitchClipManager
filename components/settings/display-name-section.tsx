// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション8.2: Props型定義

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

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
    <Card className="bg-[#1a1a1a] border-0">
      <CardHeader>
        <CardTitle className="text-gray-100">{LABELS.SECTIONS.DISPLAY_NAME_CHANGE}</CardTitle>
        <CardDescription className="text-gray-400">
          アカウントの表示名を変更できます
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-300">
              {LABELS.FORM.DISPLAY_NAME}
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              className="bg-[#0f0f0f] border-0 text-gray-100"
              placeholder={LABELS.PLACEHOLDERS.NAME}
            />
          </div>
          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isPending ? LABELS.BUTTONS.UPDATING : LABELS.BUTTONS.UPDATE_DISPLAY_NAME}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
