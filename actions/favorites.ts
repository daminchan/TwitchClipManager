/**
 * お気に入り配信者関連のサーバーアクション
 * セキュアなサーバー側処理
 */

'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ActionResult } from '@/types';

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

/**
 * 複数の配信者を一括でお気に入りに追加
 * オンボーディングフロー用
 */
export async function addMultipleFavoriteStreamers(
  streamers: Array<{
    streamerId: string;
    streamerName: string;
    streamerLogin: string;
    streamerImage?: string;
  }>
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
    if (!streamers || streamers.length === 0) {
      return {
        success: false,
        message: '配信者が選択されていません',
        error: 'Missing streamers'
      };
    }

    // 各配信者のバリデーション
    for (const streamer of streamers) {
      if (!streamer.streamerId || !streamer.streamerName || !streamer.streamerLogin) {
        return {
          success: false,
          message: '配信者情報が不足しています',
          error: 'Invalid streamer data'
        };
      }
    }

    // 一括追加（重複は無視）
    await prisma.favoriteStreamer.createMany({
      data: streamers.map((streamer) => ({
        userId: session.user.id!,
        streamerId: streamer.streamerId,
        streamerName: streamer.streamerName,
        streamerLogin: streamer.streamerLogin,
        streamerImage: streamer.streamerImage || null,
      })),
      skipDuplicates: true, // 重複を無視
    });

    // キャッシュを再検証
    revalidatePath('/');
    revalidatePath('/dashboard');
    revalidatePath('/favorites-clips');

    return {
      success: true,
      message: `${streamers.length}人をお気に入りに追加しました`
    };
  } catch (error) {
    console.error('Add multiple favorite streamers error:', error);
    return {
      success: false,
      message: 'お気に入りの一括追加に失敗しました',
      error: 'Internal server error'
    };
  }
}
