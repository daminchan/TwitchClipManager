// - オンボーディングフロー設計.md: 認証ステップ

'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Mail, Lock, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LABELS, VALIDATION } from '@/lib/constants';

const AUTH = LABELS.ONBOARDING.AUTH;
const ERRORS = LABELS.ERRORS;

interface AuthStepProps {
  onSuccess: () => void;
}

export function AuthStep({ onSuccess }: AuthStepProps) {
  const [isSignUp, setIsSignUp] = useState(true); // デフォルトは新規登録
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // バリデーション
      if (!email || !password) {
        setError(ERRORS.REQUIRED_EMAIL_PASSWORD);
        setIsLoading(false);
        return;
      }

      if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
        setError(ERRORS.PASSWORD_TOO_SHORT);
        setIsLoading(false);
        return;
      }

      if (isSignUp && name.trim().length > VALIDATION.NAME_MAX_LENGTH) {
        setError(ERRORS.NAME_TOO_LONG);
        setIsLoading(false);
        return;
      }

      // 認証実行（Credentials Provider）
      const result = await signIn('credentials', {
        email,
        password,
        name: isSignUp ? name : undefined,
        redirect: false,
      });

      if (result?.error) {
        setError(isSignUp ? ERRORS.SIGNUP_FAILED : ERRORS.LOGIN_FAILED);
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        onSuccess();
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(ERRORS.UNKNOWN_ERROR);
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);

    try {
      // Google OAuthは外部リダイレクトが必要
      // 認証成功後、/ にリダイレクトされ、オンボーディングが game ステップから再開
      await signIn('google', {
        callbackUrl: '/',
      });
    } catch (err) {
      console.error('Google sign in error:', err);
      setError(ERRORS.GOOGLE_LOGIN_FAILED);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-100 mb-2">
          {isSignUp ? AUTH.TITLE_SIGNUP : AUTH.TITLE_LOGIN}
        </h2>
        <p className="text-sm text-gray-400">
          {isSignUp ? AUTH.SUBTITLE_SIGNUP : AUTH.SUBTITLE_LOGIN}
        </p>
      </div>

      {/* Google ログインボタン */}
      <Button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 mb-6"
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path
            fill="currentColor"
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
        {AUTH.GOOGLE_SIGNIN}
      </Button>

      {/* 区切り線 */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-[#0f0f0f] text-gray-400">{AUTH.OR}</span>
        </div>
      </div>

      {/* メールアドレス + パスワードフォーム */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="space-y-4 mb-6">
          {/* 名前（新規登録時のみ） */}
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {LABELS.FORM.NAME}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={LABELS.PLACEHOLDERS.NAME}
                  className="pl-10 bg-[#1a1a1a] border-gray-700 text-gray-100"
                />
              </div>
            </div>
          )}

          {/* メールアドレス */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {LABELS.FORM.EMAIL}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={LABELS.PLACEHOLDERS.EMAIL}
                required
                className="pl-10 bg-[#1a1a1a] border-gray-700 text-gray-100"
              />
            </div>
          </div>

          {/* パスワード */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {LABELS.FORM.PASSWORD}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={LABELS.PLACEHOLDERS.PASSWORD}
                required
                className="pl-10 bg-[#1a1a1a] border-gray-700 text-gray-100"
              />
            </div>
          </div>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-700/50 rounded text-sm text-red-400">
            {error}
          </div>
        )}

        {/* 送信ボタン */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white mb-4"
        >
          {isLoading
            ? LABELS.MESSAGES.LOADING
            : isSignUp
            ? AUTH.TITLE_SIGNUP
            : AUTH.TITLE_LOGIN}
        </Button>

        {/* 切り替えリンク */}
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError('');
          }}
          className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
        >
          {isSignUp ? (
            <>
              {AUTH.ALREADY_HAVE_ACCOUNT}{' '}
              <span className="text-purple-400">{AUTH.TAB_LOGIN}</span>
            </>
          ) : (
            <>
              {AUTH.DONT_HAVE_ACCOUNT}{' '}
              <span className="text-purple-400">{AUTH.TAB_SIGNUP}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
