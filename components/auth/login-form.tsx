'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Heart, Users, Trophy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { APP_CONFIG, LABELS, ROUTES } from '@/lib/constants';

interface FeatureItemProps {
  icon: React.ReactNode;
  text: string;
}

function FeatureItem({ icon, text }: FeatureItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#f0e8d8] flex items-center justify-center">
        {icon}
      </div>
      <span className="text-sm text-[#6b655c]">{text}</span>
    </div>
  );
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || ROUTES.DASHBOARD;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);

    try {
      await signIn('google', { callbackUrl });
    } catch {
      setError(LABELS.ERRORS.GOOGLE_LOGIN_FAILED);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f5f0] p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* ロゴ・タイトル */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#d4a017] to-[#b8860b] shadow-lg mb-2">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#4a4540]">
            {APP_CONFIG.name}
          </h1>
          <p className="text-[#8a8078]">
            {APP_CONFIG.description}
          </p>
        </div>

        {/* カード */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e6e0d6] p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-6 bg-white hover:bg-[#faf8f5] text-[#4a4540] border border-[#d8d2c8] rounded-xl shadow-sm transition-all hover:shadow-md"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isLoading ? LABELS.MESSAGES.LOADING : LABELS.ONBOARDING.AUTH.GOOGLE_SIGNIN}
          </Button>
        </div>

        {/* 機能紹介 */}
        <div className="space-y-4 px-2">
          <FeatureItem
            icon={<Trophy className="w-4 h-4 text-[#c4a020]" />}
            text="人気クリップをランキングで発見"
          />
          <FeatureItem
            icon={<Users className="w-4 h-4 text-[#c4a020]" />}
            text="お気に入り配信者をフォルダで管理"
          />
          <FeatureItem
            icon={<Heart className="w-4 h-4 text-[#c4a020]" />}
            text="気になるクリップをいいねして保存"
          />
        </div>
      </div>
    </div>
  );
}
