/**
 * お気に入り配信者一覧取得 API Route
 *
 * 適用スキル: api-creator
 * 適用ルール:
 * - セクション6: API設計原則
 * - セクション10.2: API Routes は読み取り操作に使用
 *
 * 理由:
 * - お気に入りリストは読み取り専用
 * - React Query と相性が良い
 * - HTTPキャッシュを活用可能
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 認証チェック
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '認証が必要です', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // お気に入り配信者を取得
    const favorites = await prisma.favoriteStreamer.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      { data: favorites },
      {
        headers: {
          // プライベートキャッシュ（ユーザーごとに異なる）
          // ただしフロントエンドで cache: 'no-store' 指定するため実質無効
          'Cache-Control': 'private, no-cache',
        },
      }
    );
  } catch (error) {
    console.error('Get favorites error:', error);

    return NextResponse.json(
      {
        error: 'お気に入りの取得に失敗しました',
        code: 'FETCH_FAILED',
      },
      { status: 500 }
    );
  }
}
