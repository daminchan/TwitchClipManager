import { PrismaClient } from '@prisma/client';

// Prismaインスタンスをグローバルに保存（サーバーレス対応）
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma Clientのインスタンスを作成（再利用）
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// グローバルにキャッシュ（本番環境でも有効化）
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}
