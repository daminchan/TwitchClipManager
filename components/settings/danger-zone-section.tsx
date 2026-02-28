'use client';

import { useState, useTransition } from 'react';
import { signOut } from 'next-auth/react';
import { AlertTriangle, Trash2, ShieldAlert } from 'lucide-react';

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
    <Card className="bg-[#1a1a1a] border-2 border-red-900/30 hover:border-red-900/50 transition-all duration-300 shadow-lg shadow-red-900/20">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-600/10 rounded-lg">
            <ShieldAlert className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <CardTitle className="text-red-400 flex items-center gap-2">
              {LABELS.SECTIONS.DANGEROUS_ACTIONS}
            </CardTitle>
            <CardDescription className="text-gray-400 text-sm mt-1">
              アカウントを完全に削除します。この操作は取り消せません。
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!showConfirm ? (
          <Button
            onClick={() => setShowConfirm(true)}
            variant="outline"
            className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 transition-all duration-300 group"
          >
            <Trash2 className="w-4 h-4 mr-2 group-hover:animate-pulse" />
            {LABELS.BUTTONS.DELETE_ACCOUNT}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-red-900/30 to-red-900/10 border-2 border-red-500/40 text-red-300 p-5 rounded-lg">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-400 mb-2">本当に削除しますか？</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>すべてのデータが完全に削除されます</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>お気に入り配信者のリストも削除されます</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span className="font-semibold">この操作は取り消せません</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowConfirm(false)}
                variant="outline"
                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
                disabled={isPending}
              >
                {LABELS.BUTTONS.CANCEL}
              </Button>
              <Button
                onClick={handleDelete}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-500/30 transition-all duration-300"
                disabled={isPending}
              >
                {isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {LABELS.BUTTONS.DELETING}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    {LABELS.BUTTONS.DELETE_PERMANENTLY}
                  </div>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
