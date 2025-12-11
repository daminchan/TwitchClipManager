/**
 * Next.js Middleware
 * 認証が必要なページへのアクセスをエッジで制御
 *
 * 適用ルール:
 * - Next.js App Router ベストプラクティス
 * - 認証チェックをエッジで実行し、遷移を高速化
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// 認証が必要なパス
const PROTECTED_PATHS = ['/settings', '/favorites', '/favorites-clips'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 保護されたパスかどうかをチェック
  const isProtectedPath = PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path)
  );

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  // JWTトークンを取得（NextAuthのセッション確認）
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // 未認証の場合はログインページにリダイレクト
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Middlewareを適用するパスを設定
export const config = {
  matcher: ['/settings/:path*', '/favorites/:path*', '/favorites-clips/:path*'],
};
