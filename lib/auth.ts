import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { DEFAULT_FOLDER } from './constants';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'your@email.com' },
        password: { label: 'Password', type: 'password', placeholder: 'パスワード' },
        name: { label: 'Name', type: 'text', placeholder: 'Your Name' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        // ユーザーを検索
        let user = await prisma.user.findUnique({
          where: { email },
        });

        // 新規登録
        if (!user) {
          const hashedPassword = await bcrypt.hash(password, 10);
          user = await prisma.user.create({
            data: {
              email,
              password: hashedPassword,
              name: (credentials.name as string) || null,
            },
          });

          // デフォルトフォルダを作成
          try {
            await prisma.folder.create({
              data: {
                userId: user.id,
                name: DEFAULT_FOLDER.name,
                color: DEFAULT_FOLDER.color,
                order: 0,
              },
            });
          } catch {
            // フォルダ作成失敗は致命的でないため無視
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        }

        // 既存ユーザーのログイン
        if (!user.password) {
          // パスワードが設定されていない古いユーザー
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  events: {
    async createUser({ user }) {
      // OAuth新規ユーザーにデフォルトフォルダを作成
      if (user.id) {
        try {
          await prisma.folder.create({
            data: {
              userId: user.id,
              name: DEFAULT_FOLDER.name,
              color: DEFAULT_FOLDER.color,
              order: 0,
            },
          });
        } catch {
          // フォルダ作成失敗は致命的でないため無視
        }
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;

        // DBから最新のユーザー情報を取得（名前変更などを即座に反映）
        const user = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { id: true, email: true, name: true, image: true },
        });

        if (user) {
          session.user.name = user.name;
          session.user.email = user.email;
          session.user.image = user.image;
        }
      }
      return session;
    },
  },
});
