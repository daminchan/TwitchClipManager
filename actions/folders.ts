'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { LABELS } from '@/lib/constants';
import type { CreateFolderInput, UpdateFolderInput, AddStreamerToFolderInput } from '@/types/database';

export interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

/**
 * フォルダ一覧を取得
 */
export async function getFolders(): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: LABELS.ERRORS.AUTH_REQUIRED, error: 'Unauthorized' };
    }

    const folders = await prisma.folder.findMany({
      where: { userId: session.user.id },
      include: {
        folderStreamers: true,
      },
      orderBy: { order: 'asc' },
    });

    return { success: true, message: 'フォルダ一覧を取得しました', data: folders };
  } catch (error) {
    console.error('Get folders error:', error);
    return { success: false, message: 'フォルダ一覧の取得に失敗しました', error: 'Internal server error' };
  }
}

/**
 * フォルダを作成
 */
export async function createFolder(input: CreateFolderInput): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: LABELS.ERRORS.AUTH_REQUIRED, error: 'Unauthorized' };
    }

    // バリデーション
    if (!input.name || input.name.trim().length === 0) {
      return { success: false, message: 'フォルダ名を入力してください', error: 'Validation failed' };
    }

    if (input.name.trim().length > 50) {
      return { success: false, message: 'フォルダ名は50文字以内で入力してください', error: 'Validation failed' };
    }

    if (!input.color || !/^#[0-9A-Fa-f]{6}$/.test(input.color)) {
      return { success: false, message: '有効な色を選択してください', error: 'Validation failed' };
    }

    // 最大順序を取得
    const maxOrder = await prisma.folder.findFirst({
      where: { userId: session.user.id },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const newOrder = (maxOrder?.order ?? -1) + 1;

    const folder = await prisma.folder.create({
      data: {
        userId: session.user.id,
        name: input.name.trim(),
        color: input.color,
        order: newOrder,
      },
      include: {
        folderStreamers: true,
      },
    });

    revalidatePath('/');
    revalidatePath('/favorites');

    return { success: true, message: 'フォルダを作成しました', data: folder };
  } catch (error) {
    console.error('Create folder error:', error);
    return { success: false, message: 'フォルダの作成に失敗しました', error: 'Internal server error' };
  }
}

/**
 * フォルダを更新
 */
export async function updateFolder(folderId: string, input: UpdateFolderInput): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: LABELS.ERRORS.AUTH_REQUIRED, error: 'Unauthorized' };
    }

    // フォルダの所有権チェック
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      return { success: false, message: 'フォルダが見つかりません', error: 'Not found' };
    }

    if (folder.userId !== session.user.id) {
      return { success: false, message: 'このフォルダを編集する権限がありません', error: 'Forbidden' };
    }

    // バリデーション
    if (input.name !== undefined) {
      if (input.name.trim().length === 0) {
        return { success: false, message: 'フォルダ名を入力してください', error: 'Validation failed' };
      }
      if (input.name.trim().length > 50) {
        return { success: false, message: 'フォルダ名は50文字以内で入力してください', error: 'Validation failed' };
      }
    }

    if (input.color !== undefined && !/^#[0-9A-Fa-f]{6}$/.test(input.color)) {
      return { success: false, message: '有効な色を選択してください', error: 'Validation failed' };
    }

    const updatedFolder = await prisma.folder.update({
      where: { id: folderId },
      data: {
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.color !== undefined && { color: input.color }),
        ...(input.order !== undefined && { order: input.order }),
      },
      include: {
        folderStreamers: true,
      },
    });

    revalidatePath('/');
    revalidatePath('/favorites');

    return { success: true, message: 'フォルダを更新しました', data: updatedFolder };
  } catch (error) {
    console.error('Update folder error:', error);
    return { success: false, message: 'フォルダの更新に失敗しました', error: 'Internal server error' };
  }
}

/**
 * フォルダを削除
 */
export async function deleteFolder(folderId: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: LABELS.ERRORS.AUTH_REQUIRED, error: 'Unauthorized' };
    }

    // フォルダの所有権チェック
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      return { success: false, message: 'フォルダが見つかりません', error: 'Not found' };
    }

    if (folder.userId !== session.user.id) {
      return { success: false, message: 'このフォルダを削除する権限がありません', error: 'Forbidden' };
    }

    await prisma.folder.delete({
      where: { id: folderId },
    });

    revalidatePath('/');
    revalidatePath('/favorites');

    return { success: true, message: 'フォルダを削除しました' };
  } catch (error) {
    console.error('Delete folder error:', error);
    return { success: false, message: 'フォルダの削除に失敗しました', error: 'Internal server error' };
  }
}

/**
 * フォルダに配信者を追加
 */
export async function addStreamerToFolder(folderId: string, input: AddStreamerToFolderInput): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: LABELS.ERRORS.AUTH_REQUIRED, error: 'Unauthorized' };
    }

    // フォルダの所有権チェック
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      return { success: false, message: 'フォルダが見つかりません', error: 'Not found' };
    }

    if (folder.userId !== session.user.id) {
      return { success: false, message: 'このフォルダに配信者を追加する権限がありません', error: 'Forbidden' };
    }

    // 既に追加済みかチェック
    const existing = await prisma.folderStreamer.findUnique({
      where: {
        folderId_streamerId: {
          folderId,
          streamerId: input.streamerId,
        },
      },
    });

    if (existing) {
      return { success: false, message: LABELS.ERRORS.STREAMER_ALREADY_IN_FOLDER, error: 'Already exists' };
    }

    const folderStreamer = await prisma.folderStreamer.create({
      data: {
        folderId,
        streamerId: input.streamerId,
        streamerName: input.streamerName,
        streamerLogin: input.streamerLogin,
        streamerImage: input.streamerImage,
      },
    });

    revalidatePath('/');
    revalidatePath('/favorites');

    return { success: true, message: 'フォルダに配信者を追加しました', data: folderStreamer };
  } catch (error) {
    console.error('Add streamer to folder error:', error);
    return { success: false, message: LABELS.ERRORS.STREAMER_ADD_TO_FOLDER_FAILED, error: 'Internal server error' };
  }
}

/**
 * フォルダから配信者を削除
 */
export async function removeStreamerFromFolder(folderId: string, streamerId: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: LABELS.ERRORS.AUTH_REQUIRED, error: 'Unauthorized' };
    }

    // フォルダの所有権チェック
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      return { success: false, message: 'フォルダが見つかりません', error: 'Not found' };
    }

    if (folder.userId !== session.user.id) {
      return { success: false, message: 'このフォルダから配信者を削除する権限がありません', error: 'Forbidden' };
    }

    await prisma.folderStreamer.delete({
      where: {
        folderId_streamerId: {
          folderId,
          streamerId,
        },
      },
    });

    revalidatePath('/');
    revalidatePath('/favorites');

    return { success: true, message: 'フォルダから配信者を削除しました' };
  } catch (error) {
    console.error('Remove streamer from folder error:', error);
    return { success: false, message: LABELS.ERRORS.STREAMER_REMOVE_FROM_FOLDER_FAILED, error: 'Internal server error' };
  }
}

/**
 * フォルダの並び順を更新（複数）
 */
export async function updateFoldersOrder(folderOrders: { id: string; order: number }[]): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: LABELS.ERRORS.AUTH_REQUIRED, error: 'Unauthorized' };
    }

    // トランザクションで一括更新
    await prisma.$transaction(
      folderOrders.map((item) =>
        prisma.folder.updateMany({
          where: {
            id: item.id,
            userId: session.user.id, // 所有権チェック
          },
          data: {
            order: item.order,
          },
        })
      )
    );

    revalidatePath('/');
    revalidatePath('/favorites');

    return { success: true, message: 'フォルダの並び順を更新しました' };
  } catch (error) {
    console.error('Update folders order error:', error);
    return { success: false, message: 'フォルダの並び順更新に失敗しました', error: 'Internal server error' };
  }
}
