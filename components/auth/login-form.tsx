'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { validateLoginForm } from '@/lib/validations/user';
import { APP_CONFIG, LABELS, ROUTES } from '@/lib/constants';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || ROUTES.DASHBOARD;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // クライアント側バリデーション
    const validation = validateLoginForm(email, password);
    if (!validation.success) {
      setError(validation.error!);
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: email.trim(),
        password: password.trim(),
        name: name.trim() || email.split('@')[0],
        redirect: false,
      });

      if (result?.error) {
        setError('メールアドレスまたはパスワードが正しくありません');
        setIsLoading(false);
        return;
      }

      // callbackUrlがあればそこへ、なければダッシュボードへ
      router.push(callbackUrl);
      router.refresh();
    } catch (error) {
      console.error('Login error:', error);
      setError('ログイン中にエラーが発生しました');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {APP_CONFIG.name}
          </CardTitle>
          <CardDescription className="text-center">
            {APP_CONFIG.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                {LABELS.FORM.EMAIL}
              </label>
              <Input
                id="email"
                type="email"
                placeholder={LABELS.PLACEHOLDERS.EMAIL}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                {LABELS.FORM.PASSWORD}
              </label>
              <Input
                id="password"
                type="password"
                placeholder={LABELS.PLACEHOLDERS.PASSWORD}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  {LABELS.FORM.NAME}（オプション）
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder={LABELS.PLACEHOLDERS.NAME}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={isLoading}
            >
              {isLoading
                ? (isSignUp ? LABELS.BUTTONS.SIGNING_UP : LABELS.BUTTONS.LOGGING_IN)
                : (isSignUp ? LABELS.BUTTONS.SIGNUP : LABELS.BUTTONS.LOGIN)
              }
            </Button>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
                className="text-purple-600 hover:text-purple-700 hover:underline"
              >
                {isSignUp
                  ? 'すでにアカウントをお持ちの方はこちら'
                  : 'アカウントをお持ちでない方はこちら'
                }
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
