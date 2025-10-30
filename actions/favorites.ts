/**
 * お気に入り配信者関連のサーバーアクション
 * セキュアなサーバー側処理
 */

'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export interface ActionResult {
  success: boolean;
  message: string;
  error?: string;
}

export interface FavoriteStreamer {
  id: string;
  userId: string;
  streamerId: string;
  streamerName: string;
  streamerLogin: string;
  streamerImage: string | null;
  createdAt: Date;
}

export interface GetFavoritesResult {
  success: boolean;
  data?: FavoriteStreamer[];
  error?: string;
}

/**
 * お気に入り配信者一覧を取得
 */
export async function getFavoriteStreamers(): Promise<GetFavoritesResult> {
  try {
    // 認証チェック
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized'
      };
    }

    // お気に入り配信者を取得
    const favorites = await prisma.favoriteStreamer.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: favorites
    };
  } catch (error) {
    console.error('Get favorite streamers error:', error);
    return {
      success: false,
      error: 'Failed to fetch favorites'
    };
  }
}

/**
 * お気に入り配信者を追加
 */
export async function addFavoriteStreamer(
  streamerId: string,
  streamerName: string,
  streamerLogin: string,
  streamerImage?: string
): Promise<ActionResult> {
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
    if (!streamerId || !streamerName || !streamerLogin) {
      return {
        success: false,
        message: '必須項目が不足しています',
        error: 'Missing required fields'
      };
    }

    // 既に追加済みかチェック
    const existing = await prisma.favoriteStreamer.findUnique({
      where: {
        userId_streamerId: {
          userId: session.user.id,
          streamerId,
        },
      },
    });

    if (existing) {
      return {
        success: false,
        message: 'すでにお気に入りに追加済みです',
        error: 'Already exists'
      };
    }

    // お気に入りに追加
    await prisma.favoriteStreamer.create({
      data: {
        userId: session.user.id,
        streamerId,
        streamerName,
        streamerLogin,
        streamerImage: streamerImage || null,
      },
    });

    // キャッシュを再検証
    revalidatePath('/dashboard');
    revalidatePath('/favorites-clips');

    return {
      success: true,
      message: 'お気に入りに追加しました'
    };
  } catch (error) {
    console.error('Add favorite streamer error:', error);
    return {
      success: false,
      message: 'お気に入りの追加に失敗しました',
      error: 'Internal server error'
    };
  }
}

/**
 * お気に入り配信者を削除
 */
export async function removeFavoriteStreamer(streamerId: string): Promise<ActionResult> {
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
    if (!streamerId) {
      return {
        success: false,
        message: 'streamerIdが必要です',
        error: 'Missing streamerId'
      };
    }

    // お気に入りから削除
    await prisma.favoriteStreamer.delete({
      where: {
        userId_streamerId: {
          userId: session.user.id,
          streamerId,
        },
      },
    });

    // キャッシュを再検証
    revalidatePath('/dashboard');
    revalidatePath('/favorites-clips');

    return {
      success: true,
      message: 'お気に入りから削除しました'
    };
  } catch (error) {
    console.error('Remove favorite streamer error:', error);
    return {
      success: false,
      message: 'お気に入りの削除に失敗しました',
      error: 'Internal server error'
    };
  }
}
