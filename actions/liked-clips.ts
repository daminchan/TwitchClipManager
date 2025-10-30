/**
 * いいねクリップ関連のサーバーアクション
 * セキュアなサーバー側処理
 */

'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { LikedClip, CreateLikedClipInput } from '@/types';

export interface ActionResult {
  success: boolean;
  message: string;
  error?: string;
}

export interface GetLikedClipsResult {
  success: boolean;
  data?: LikedClip[];
  error?: string;
}

/**
 * いいねしたクリップ一覧を取得
 */
export async function getLikedClips(): Promise<GetLikedClipsResult> {
  try {
    // 認証チェック
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized'
      };
    }

    // いいねクリップを取得
    const likedClips = await prisma.likedClip.findMany({
      where: { userId: session.user.id },
      orderBy: { likedAt: 'desc' },
    });

    return {
      success: true,
      data: likedClips
    };
  } catch (error) {
    console.error('Get liked clips error:', error);
    return {
      success: false,
      error: 'Failed to fetch liked clips'
    };
  }
}

/**
 * クリップをいいねリストに追加
 */
export async function addLikedClip(clipData: CreateLikedClipInput): Promise<ActionResult> {
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
    if (!clipData.clipId || !clipData.clipTitle || !clipData.broadcasterName) {
      return {
        success: false,
        message: '必須項目が不足しています',
        error: 'Missing required fields'
      };
    }

    // 既にいいね済みかチェック
    const existing = await prisma.likedClip.findUnique({
      where: {
        userId_clipId: {
          userId: session.user.id,
          clipId: clipData.clipId,
        },
      },
    });

    if (existing) {
      return {
        success: false,
        message: 'すでにいいね済みです',
        error: 'Already liked'
      };
    }

    // いいねを追加
    await prisma.likedClip.create({
      data: {
        userId: session.user.id,
        clipId: clipData.clipId,
        clipUrl: clipData.clipUrl,
        clipEmbedUrl: clipData.clipEmbedUrl,
        clipTitle: clipData.clipTitle,
        broadcasterId: clipData.broadcasterId,
        broadcasterName: clipData.broadcasterName,
        creatorName: clipData.creatorName,
        thumbnailUrl: clipData.thumbnailUrl,
        viewCount: clipData.viewCount,
        duration: clipData.duration,
        clipCreatedAt: clipData.clipCreatedAt,
      },
    });

    // キャッシュを再検証
    revalidatePath('/dashboard');
    revalidatePath('/favorites-clips');

    return {
      success: true,
      message: 'いいねしました'
    };
  } catch (error) {
    console.error('Add liked clip error:', error);
    return {
      success: false,
      message: 'いいねに失敗しました',
      error: 'Internal server error'
    };
  }
}

/**
 * クリップのいいねを解除
 */
export async function removeLikedClip(clipId: string): Promise<ActionResult> {
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
    if (!clipId) {
      return {
        success: false,
        message: 'clipIdが必要です',
        error: 'Missing clipId'
      };
    }

    // いいね済みかチェック
    const existing = await prisma.likedClip.findUnique({
      where: {
        userId_clipId: {
          userId: session.user.id,
          clipId,
        },
      },
    });

    if (!existing) {
      return {
        success: false,
        message: 'いいねされていません',
        error: 'Not liked'
      };
    }

    // いいねを削除
    await prisma.likedClip.delete({
      where: {
        userId_clipId: {
          userId: session.user.id,
          clipId,
        },
      },
    });

    // キャッシュを再検証
    revalidatePath('/dashboard');
    revalidatePath('/favorites-clips');

    return {
      success: true,
      message: 'いいねを解除しました'
    };
  } catch (error) {
    console.error('Remove liked clip error:', error);
    return {
      success: false,
      message: 'いいねの解除に失敗しました',
      error: 'Internal server error'
    };
  }
}
