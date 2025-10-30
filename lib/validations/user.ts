/**
 * ユーザー関連のバリデーションロジック
 * クライアント・サーバー両方で使用可能
 */

import { VALIDATION } from '@/lib/constants';

export interface ValidationResult {
  success: boolean;
  error?: string;
}

/**
 * メールアドレスのバリデーション
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim().length === 0) {
    return { success: false, error: 'メールアドレスを入力してください' };
  }

  if (!VALIDATION.EMAIL_REGEX.test(email)) {
    return { success: false, error: '有効なメールアドレスを入力してください' };
  }

  return { success: true };
}

/**
 * パスワードのバリデーション
 */
export function validatePassword(password: string): ValidationResult {
  if (!password || password.trim().length === 0) {
    return { success: false, error: 'パスワードを入力してください' };
  }

  if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
    return {
      success: false,
      error: `パスワードは${VALIDATION.PASSWORD_MIN_LENGTH}文字以上で入力してください`
    };
  }

  return { success: true };
}

/**
 * 表示名のバリデーション
 */
export function validateDisplayName(name: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { success: false, error: '名前を入力してください' };
  }

  if (name.trim().length > VALIDATION.NAME_MAX_LENGTH) {
    return {
      success: false,
      error: `名前は${VALIDATION.NAME_MAX_LENGTH}文字以内で入力してください`
    };
  }

  return { success: true };
}

/**
 * ログインフォームのバリデーション
 */
export function validateLoginForm(email: string, password: string): ValidationResult {
  const emailResult = validateEmail(email);
  if (!emailResult.success) return emailResult;

  const passwordResult = validatePassword(password);
  if (!passwordResult.success) return passwordResult;

  return { success: true };
}
