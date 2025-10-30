// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション8.2: Props型定義

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LABELS } from '@/lib/constants';

interface AccountInfoSectionProps {
  email: string;
  name: string;
}

export function AccountInfoSection({ email, name }: AccountInfoSectionProps) {
  return (
    <Card className="bg-[#1a1a1a] border-0">
      <CardHeader>
        <CardTitle className="text-gray-100">{LABELS.SECTIONS.ACCOUNT_INFO}</CardTitle>
        <CardDescription className="text-gray-400">
          登録されているアカウント情報
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="text-sm text-gray-400">{LABELS.FORM.EMAIL}</div>
          <div className="text-gray-100 mt-1">{email}</div>
        </div>
        <div>
          <div className="text-sm text-gray-400">{LABELS.FORM.DISPLAY_NAME}</div>
          <div className="text-gray-100 mt-1">{name || '未設定'}</div>
        </div>
      </CardContent>
    </Card>
  );
}
