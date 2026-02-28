# Twitch Clip Viewer

Twitch配信者のクリップを人気順で表示するWebアプリケーション。

## 技術スタック

- Next.js 14 (App Router) / TypeScript / Tailwind CSS / shadcn/ui
- Prisma / Supabase (PostgreSQL) / NextAuth.js
- Twitch Helix API

## ディレクトリ構造

```
app/              # ページ（サーバーコンポーネント）
components/       # UIコンポーネント（クライアント）
actions/          # サーバーアクション
hooks/            # カスタムフック
lib/              # ユーティリティ、constants.ts
types/            # 型定義
```

## コマンド

- `npm run dev` - 開発サーバー
- `npm run build` - ビルド
- `npx prisma generate` - Prisma生成
- `npx prisma db push` - DBスキーマ反映

## 厳守事項

- **NEVER**: 機密情報をコードに含めない（環境変数は`.env.local`）
- **NEVER**: mainへの直接プッシュ禁止
- **NEVER**: ユーザー確認なしのコミット・プッシュ
- **MUST**: `app/*/page.tsx`はサーバーコンポーネント
- **MUST**: 認証は`await auth()`でサーバー側実行

## ルール・スキル

@.claude/rules/workflow.md
@.claude/rules/code-style.md
@.claude/rules/patterns.md
