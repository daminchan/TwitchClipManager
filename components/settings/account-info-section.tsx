// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション8.2: Props型定義

'use client';

import { Mail, User, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LABELS } from '@/lib/constants';

interface AccountInfoSectionProps {
  email: string;
  name: string;
}

export function AccountInfoSection({ email, name }: AccountInfoSectionProps) {
  return (
    <Card className="bg-[#1a1a1a] border border-gray-800 hover:border-gray-700 transition-all duration-300 shadow-lg hover:shadow-blue-500/10">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/10 rounded-lg">
            <Info className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-gray-100">{LABELS.SECTIONS.ACCOUNT_INFO}</CardTitle>
            <CardDescription className="text-gray-400 text-sm mt-1">
              登録されているアカウント情報
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-[#0f0f0f] border border-gray-800 rounded-lg hover:border-gray-700 transition-colors">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Mail className="w-4 h-4" />
            {LABELS.FORM.EMAIL}
          </div>
          <div className="text-gray-100 font-medium">{email}</div>
        </div>
        <div className="p-4 bg-[#0f0f0f] border border-gray-800 rounded-lg hover:border-gray-700 transition-colors">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <User className="w-4 h-4" />
            {LABELS.FORM.DISPLAY_NAME}
          </div>
          <div className="text-gray-100 font-medium">
            {name || <span className="text-gray-500 italic">未設定</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
