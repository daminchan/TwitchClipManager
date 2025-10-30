/**
 * ユーザー関連のサーバーアクション
 * セキュアなサーバー側処理
 */

'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateDisplayName } from '@/lib/validations/user';

export interface ActionResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * 表示名を更新
 */
export async function updateDisplayName(name: string): Promise<ActionResult> {
  try {
    // 認証チェック
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: '認証が必要です',
        error: 'Unauthorized'
      };
    }

    // バリデーション
    const validation = validateDisplayName(name);
    if (!validation.success) {
      return {
        success: false,
        message: validation.error!,
        error: 'Validation failed'
      };
    }

    // データベース更新
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: name.trim() },
    });

    // キャッシュを再検証
    revalidatePath('/settings');
    revalidatePath('/dashboard');

    return {
      success: true,
      message: '表示名を更新しました'
    };
  } catch (error) {
    console.error('Update display name error:', error);
    return {
      success: false,
      message: '表示名の更新に失敗しました',
      error: 'Internal server error'
    };
  }
}

/**
 * アカウントを削除
 */
export async function deleteAccount(): Promise<ActionResult> {
  try {
    // 認証チェック
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: '認証が必要です',
        error: 'Unauthorized'
      };
    }

    // ユーザーデータを完全削除（Cascadeで関連データも削除される）
    await prisma.user.delete({
      where: { id: session.user.id },
    });

    // キャッシュを再検証
    revalidatePath('/');

    return {
      success: true,
      message: 'アカウントを削除しました'
    };
  } catch (error) {
    console.error('Delete account error:', error);
    return {
      success: false,
      message: 'アカウントの削除に失敗しました',
      error: 'Internal server error'
    };
  }
}
