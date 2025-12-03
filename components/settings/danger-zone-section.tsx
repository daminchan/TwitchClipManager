// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション8.2: Props型定義

'use client';

import { useState, useTransition } from 'react';
import { signOut } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { deleteAccount } from '@/actions/user';
import { LABELS, ROUTES, TIMING } from '@/lib/constants';

interface DangerZoneSectionProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function DangerZoneSection({ onSuccess, onError }: DangerZoneSectionProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    startTransition(async () => {
      const result = await deleteAccount();

      if (result.success) {
        onSuccess(result.message);

        // 少し待ってからログアウト
        setTimeout(async () => {
          await signOut({ callbackUrl: ROUTES.HOME });
        }, TIMING.REDIRECT_DELAY);
      } else {
        onError(result.message);
        setShowConfirm(false);
      }
    });
  };

  return (
    <Card className="bg-[#1a1a1a] border-0 border-red-900/20">
      <CardHeader>
        <CardTitle className="text-red-500">{LABELS.SECTIONS.DANGEROUS_ACTIONS}</CardTitle>
        <CardDescription className="text-gray-400">
          アカウントを完全に削除します。この操作は取り消せません。
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!showConfirm ? (
          <Button
            onClick={() => setShowConfirm(true)}
            variant="outline"
            className="w-full border-red-500/50 text-red-500 hover:bg-red-500/10"
          >
            {LABELS.BUTTONS.DELETE_ACCOUNT}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="bg-red-900/20 border border-red-500/30 text-red-300 text-sm p-4 rounded-lg">
              <p className="font-semibold mb-2">本当に削除しますか？</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>すべてのデータが完全に削除されます</li>
                <li>お気に入り配信者のリストも削除されます</li>
                <li>この操作は取り消せません</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowConfirm(false)}
                variant="outline"
                className="flex-1 border-gray-700 text-gray-300"
                disabled={isPending}
              >
                {LABELS.BUTTONS.CANCEL}
              </Button>
              <Button
                onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={isPending}
              >
                {isPending ? LABELS.BUTTONS.DELETING : LABELS.BUTTONS.DELETE_PERMANENTLY}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
