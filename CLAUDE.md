# 開発ルール・ガイドライン

> **重要**: 新規機能追加・修正を行う前に必ずこのドキュメントを読み、各ルールとその理由を理解してから実装すること

## 🚨 最重要ポリシー（Non-Negotiable）

以下のルールは**絶対に厳守**すること。違反は重大なセキュリティリスクまたはプロジェクト破壊につながります。

### 1. セキュリティ最優先
- 機密情報（DB接続・APIキー・トークン等）をコード・設定・ログ・PRへ**絶対に露出しない**
- 環境変数は `.env.local` のみで管理し、Gitにコミットしない
- `.claude/settings.local.json` に機密情報を含めない（詳細は[セキュリティ](#セキュリティ)セクション参照）

### 2. 必読義務
- **実装前に必ず**本ドキュメント全体と `.claude/skills/`（該当スキル）を読む
- どのルールをなぜ適用するかを明示できない作業は行わない
- 不明点があれば実装前に確認する

### 3. 勝手プッシュ厳禁
- `main` ブランチへの直接プッシュは**絶対禁止**
- すべての変更は Plan → Implementation → Review → PR → Merge のフローを経由
- 緊急時も例外なくPRを作成する

### 4. 実行前チェックと許可
- 破壊的操作（DB削除・権限変更・インフラ変更・シークレット操作）は**実行前に根拠を提示**し、承認者の許可を得る
- `git push --force`、`git reset --hard`、`prisma migrate reset` 等は特に注意
- 不明なコマンドは実行前に確認する

### 5. 変更時の宣言義務
- 機能追加／修正／リファクタ時は、PR説明に以下を**必ず明記**:
  - 使用する Skill 名（該当する場合）
  - 適用する CLAUDE.md のルール（セクション番号と内容）
  - 適用理由と期待される結果
- レビュアーがルール適用を確認できるようにする

---

## 📋 目次
1. [プロジェクト概要](#プロジェクト概要)
2. [技術スタック](#技術スタック)
3. [ディレクトリ構造](#ディレクトリ構造)
4. [コーディング規約](#コーディング規約)
5. [UI/UXデザイン原則](#uiuxデザイン原則)
6. [API設計原則](#api設計原則)
7. [状態管理](#状態管理)
8. [型定義](#型定義)
9. [エラーハンドリング](#エラーハンドリング)
10. [パフォーマンス](#パフォーマンス)
11. [セキュリティ](#セキュリティ)
12. [Claude Skills使用ガイドライン](#claude-skills使用ガイドライン)
13. [Next.js App Router ベストプラクティス](#nextjs-app-router-ベストプラクティス必須)
14. [サーバーアクション](#サーバーアクション)
15. [カスタムフック](#カスタムフックによるロジック分離)
16. [バリデーション](#バリデーション二段階チェック)
17. [定数管理](#定数管理dry原則)
18. [ファイル命名規則](#ファイル命名規則厳守)
19. [チェックリスト](#新機能実装時のチェックリスト)
20. [まとめ](#まとめ)

---

## プロジェクト概要

### アプリケーション名
Twitch Clip Viewer

### 目的
指定したTwitch配信者のクリップを人気順（視聴回数順）で表示するWebアプリケーション

---

## 技術スタック

### フロントエンド
- **Next.js 14+** (App Router)
  - **理由**: 最新のReactフレームワークでサーバーコンポーネントを活用し、パフォーマンス最適化
- **TypeScript**
  - **理由**: 型安全性を確保し、バグを事前に防ぐ
- **Tailwind CSS**
  - **理由**: ユーティリティファーストで開発速度向上、一貫したデザイン
- **shadcn/ui**
  - **理由**: アクセシブルで高品質なコンポーネント、カスタマイズ性が高い

### バックエンド・データベース
- **Supabase**
  - **理由**: PostgreSQLベースのBaaS、認証・リアルタイム機能が統合
- **Prisma**
  - **理由**: 型安全なORM、マイグレーション管理が容易
- **NextAuth.js (Auth.js)**
  - **理由**: Next.js専用の認証ライブラリ、多様なプロバイダー対応、使いやすい

### API連携
- **Twitch Helix API**
  - **理由**: 公式APIで信頼性が高く、クリップデータを取得可能

### パッケージマネージャー
- **npm**
  - **理由**: Node.jsのデフォルト、広く使われている

---

## ディレクトリ構造

```
my-app/
├── app/                          # Next.js App Router
│   ├── (route)/page.tsx          # サーバーコンポーネント（認証チェック等）
│   ├── api/                      # API Routes（レガシー、必要に応じて）
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts      # NextAuth.js認証エンドポイント
│   │   ├── favorites/
│   │   │   └── route.ts          # お気に入り配信者CRUD
│   │   └── twitch/
│   │       ├── clips/
│   │       │   └── route.ts      # クリップ取得
│   │       └── streamers/
│   │           └── route.ts      # 配信者検索
│   ├── login/
│   │   └── page.tsx              # ログインページ（サーバーコンポーネント）
│   ├── dashboard/
│   │   └── page.tsx              # ダッシュボード（サーバーコンポーネント）
│   ├── settings/
│   │   └── page.tsx              # 設定ページ（サーバーコンポーネント）
│   ├── layout.tsx                # ルートレイアウト
│   ├── page.tsx                  # ランディングページ
│   └── globals.css               # グローバルスタイル
├── components/                   # Reactコンポーネント
│   ├── [feature]/                # 機能別コンポーネント
│   │   ├── [feature]-content.tsx  # メインクライアントコンポーネント
│   │   └── [sub-component].tsx    # サブコンポーネント
│   ├── auth/
│   │   └── login-form.tsx        # ログインフォーム（クライアント）
│   ├── dashboard/
│   │   ├── dashboard-content.tsx # ダッシュボードメイン（クライアント）
│   │   ├── dashboard-sidebar.tsx # サイドバー
│   │   └── clip-sort-tabs.tsx    # ソートタブ
│   ├── settings/
│   │   ├── settings-content.tsx  # 設定メイン（クライアント）
│   │   ├── display-name-section.tsx
│   │   ├── account-info-section.tsx
│   │   └── danger-zone-section.tsx
│   ├── streamers/
│   │   ├── streamer-search.tsx   # 配信者検索
│   │   ├── streamer-card.tsx     # 配信者カード
│   │   └── favorite-list.tsx     # お気に入りリスト
│   ├── clips/
│   │   ├── clip-card.tsx         # クリップカード
│   │   └── clip-grid.tsx         # クリップグリッド
│   ├── layout/
│   │   ├── header.tsx            # ヘッダー
│   │   ├── mobile-nav.tsx        # モバイルナビゲーション
│   │   └── footer.tsx            # フッター
│   └── ui/                       # shadcn/ui コンポーネント
├── actions/                      # サーバーアクション
│   └── user.ts                   # 'use server' ディレクティブ付き
├── hooks/                        # カスタムフック
│   ├── use-dashboard-clips.ts    # ダッシュボードクリップ管理
│   └── use-favorites.ts          # お気に入り管理フック
├── lib/                          # ユーティリティ・設定
│   ├── validations/              # バリデーションロジック
│   │   └── user.ts               # ユーザー関連バリデーション
│   ├── constants.ts              # 定数管理
│   ├── auth.ts                   # NextAuth設定
│   ├── prisma.ts                 # Prisma Client
│   ├── twitch-api.ts             # Twitch API関連
│   └── utils.ts                  # 汎用ユーティリティ
├── types/                        # 型定義
│   ├── twitch.ts                 # Twitch関連の型
│   ├── database.ts               # DB types (LikedClip, etc.)
│   ├── api.ts                    # API response types
│   └── auth.ts                   # 認証関連の型
├── prisma/                       # Prismaスキーマ
│   ├── schema.prisma             # データベーススキーマ
│   └── migrations/               # マイグレーションファイル
├── public/                       # 静的ファイル
├── .claude/                      # Claude Code設定
│   └── skills/                   # Claude Skillsスキル定義
├── .env.local                    # 環境変数（gitignore）
└── .env.example                  # 環境変数サンプル
```

### ディレクトリ構造のルール

**ルール1**: コンポーネントは責務ごとに分離
- **理由**: 再利用性を高め、保守性を向上させる

**ルール2**: `components/ui/` はshadcn/ui専用
- **理由**: shadcn/uiのコンポーネントと自作コンポーネントを明確に区別

**ルール3**: ビジネスロジックは `lib/` に配置
- **理由**: コンポーネントから分離し、テスタビリティを向上

**ルール4**: 型定義は `types/` に集約
- **理由**: 型の一元管理で整合性を保つ

---

## コーディング規約

### 1. ファイル命名規則

**ルール**: kebab-case を使用
```
✅ search-form.tsx
✅ clip-card.tsx
❌ SearchForm.tsx
❌ clipCard.tsx
```
**理由**: ファイルシステムでの可読性向上、大文字小文字の問題を回避

### 2. コンポーネント命名規則

**ルール**: PascalCase を使用
```typescript
✅ export function SearchForm() {}
✅ export function ClipCard() {}
❌ export function searchForm() {}
```
**理由**: React/TypeScriptの標準的な命名規則

### 3. 関数命名規則

**ルール**: camelCase を使用
```typescript
✅ function getTwitchClips() {}
✅ function formatViewCount() {}
❌ function GetTwitchClips() {}
```
**理由**: JavaScript/TypeScriptの標準的な命名規則

### 4. 定数命名規則

**ルール**: UPPER_SNAKE_CASE を使用
```typescript
✅ const API_BASE_URL = 'https://api.twitch.tv/helix';
✅ const MAX_CLIPS_PER_PAGE = 20;
❌ const apiBaseUrl = '...';
```
**理由**: 定数であることを視覚的に明確化

### 5. インポート順序

**ルール**: 以下の順序でインポート
```typescript
// 1. React/Next.js
import { useState } from 'react';
import Image from 'next/image';

// 2. 外部ライブラリ
import { format } from 'date-fns';

// 3. 内部コンポーネント
import { Button } from '@/components/ui/button';
import { SearchForm } from '@/components/search-form';

// 4. ユーティリティ・型
import { cn } from '@/lib/utils';
import type { TwitchClip } from '@/types/twitch';

// 5. スタイル
import './styles.css';
```
**理由**: 依存関係を明確化し、可読性を向上

### 6. コンポーネント構造

**ルール**: 以下の順序で記述
```typescript
// 1. 型定義
interface ClipCardProps {
  clip: TwitchClip;
}

// 2. コンポーネント定義
export function ClipCard({ clip }: ClipCardProps) {
  // 3. フック
  const [isPlaying, setIsPlaying] = useState(false);

  // 4. ハンドラー関数
  const handlePlay = () => {
    setIsPlaying(true);
  };

  // 5. JSX
  return (
    <div>
      {/* ... */}
    </div>
  );
}
```
**理由**: 一貫した構造で可読性を向上

### 7. 型定義

**ルール**: `interface` を優先、必要に応じて `type` を使用
```typescript
✅ interface User { name: string; }
✅ type Status = 'loading' | 'success' | 'error';
❌ type User = { name: string; }  // interfaceで十分な場合
```
**理由**: `interface` は拡張可能で、エラーメッセージが明確

---

## UI/UXデザイン原則

### デザインリファレンス

**ルール**: YouTubeのUIを参考にする
- カードベースのグリッドレイアウト
- サムネイル中心のデザイン
- ホバーエフェクト
- ダークモード対応

**理由**: ユーザーが慣れ親しんだUIで学習コストを削減

### shadcn/ui使用ルール

**ルール1**: 必ずshadcn/uiから追加
```bash
npx shadcn@latest add button
npx shadcn@latest add input
```
**理由**: 一貫性のあるデザインシステムを維持

**ルール2**: コンポーネントは `components/ui/` に配置
```
components/
├── ui/              # shadcn/uiコンポーネント
│   ├── button.tsx
│   └── input.tsx
├── search-form.tsx  # 独自コンポーネント
```
**理由**: shadcn/uiと自作コンポーネントを明確に区別

**ルール3**: カスタマイズは `variants` を使用
```typescript
const buttonVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        default: "default-classes",
        twitch: "bg-purple-600 hover:bg-purple-700",
      },
    },
  }
);
```
**理由**: 拡張性を保ちながらカスタマイズ

### レスポンシブデザイン

**ルール**: モバイルファースト
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
```
**理由**: モバイルユーザーを優先し、段階的に拡張

### カラーパレット

**ルール**: Twitchブランドカラーを使用
```css
/* Twitch Purple */
--twitch-purple: #9146FF;
--twitch-purple-hover: #772CE8;
```
**理由**: Twitchアプリであることを視覚的に明確化

---

## API設計原則

### API Routes配置

**ルール**: `app/api/` 配下に機能ごとに配置
```
app/api/
├── auth/
│   └── [...nextauth]/route.ts  # POST/GET /api/auth/[...]
├── favorites/
│   └── route.ts                # GET/POST/DELETE /api/favorites
└── twitch/
    ├── clips/route.ts          # GET /api/twitch/clips
    └── streamers/route.ts      # GET /api/twitch/streamers
```
**理由**: RESTful設計で直感的なエンドポイント

### データベース設計

**ルール**: Prismaスキーマで型安全なデータモデル定義
```prisma
model User {
  id                String              @id @default(cuid())
  email             String              @unique
  name              String?
  image             String?
  favoriteStreamers FavoriteStreamer[]
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
}

model FavoriteStreamer {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  streamerId      String   # Twitch配信者ID
  streamerName    String   # Twitch配信者名
  streamerImage   String?  # プロフィール画像URL
  createdAt       DateTime @default(now())

  @@unique([userId, streamerId])
}
```
**理由**: ユーザーごとのお気に入り配信者を管理、重複防止

### 認証フロー

**ルール**: NextAuth.jsでCredentialsプロバイダーを使用
1. ユーザーがメールアドレスでログイン
2. NextAuth.jsがセッションを管理
3. データベースにユーザー情報を保存
4. 保護されたルートで認証チェック

**理由**: シンプルで使いやすい認証、拡張可能（Google/GitHub等追加可能）

### エラーレスポンス

**ルール**: 一貫したエラー形式
```typescript
return NextResponse.json(
  {
    error: 'Error message',
    code: 'ERROR_CODE',
    details: {...}
  },
  { status: 400 }
);
```
**理由**: フロントエンドでの統一的なエラーハンドリング

### 環境変数

**ルール**: すべての機密情報は環境変数化
```bash
# .env.local
# データベース
DATABASE_URL="postgresql://user:password@host:5432/database"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Twitch API
TWITCH_CLIENT_ID="your-twitch-client-id"
TWITCH_CLIENT_SECRET="your-twitch-client-secret"
```

```typescript
// 環境変数の検証
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
if (!TWITCH_CLIENT_ID) {
  throw new Error('TWITCH_CLIENT_ID is not defined');
}
```
**理由**: セキュリティとポータビリティの確保

---

## 状態管理

### ローカル状態

**ルール**: `useState` を使用
```typescript
const [clips, setClips] = useState<TwitchClip[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```
**理由**: シンプルなアプリケーションでは十分

### サーバー状態

**ルール**: 将来的にReact QueryやSWRを検討
**理由**: キャッシング、再検証、最適化が容易

---

## 型定義

### Twitch API型

**ルール**: API仕様に基づいた厳密な型定義
```typescript
// types/twitch.ts
export interface TwitchClip {
  id: string;
  url: string;
  embed_url: string;
  broadcaster_id: string;
  broadcaster_name: string;
  creator_id: string;
  creator_name: string;
  video_id: string;
  game_id: string;
  language: string;
  title: string;
  view_count: number;
  created_at: string;
  thumbnail_url: string;
  duration: number;
  vod_offset: number | null;
}

export interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count: number;
  created_at: string;
}
```
**理由**: 型安全性を最大化し、ランタイムエラーを防ぐ

### Props型

**ルール**: すべてのコンポーネントでProps型を定義
```typescript
interface ClipCardProps {
  clip: TwitchClip;
  onPlay?: () => void;
}

export function ClipCard({ clip, onPlay }: ClipCardProps) {
  // ...
}
```
**理由**: コンポーネントのインターフェースを明確化

### バレルエクスポート（Barrel Exports）

**ルール**: `types/index.ts` で一括エクスポート
```typescript
// types/index.ts
export * from './twitch';
export * from './database';
export * from './api';
export * from './auth';
```

#### Before（バレル化なし）
```typescript
// 各ファイルで個別にインポート
import type { TwitchClip } from '@/types/twitch';
import type { LikedClip } from '@/types/database';
import type { ApiResponse } from '@/types/api';
import type { SessionUser } from '@/types/auth';
```

#### After（バレル化あり）
```typescript
// types/index.ts から一括インポート
import type { TwitchClip, LikedClip, ApiResponse, SessionUser } from '@/types';
```

**メリット**:
- **Import文の簡潔化**: 複数の型を1行でインポート可能
- **変更容易性**: ファイル構成変更時、バレルファイルのみ修正すればOK
- **パスの統一**: すべて `@/types` から取得できる
- **可読性向上**: Import文が短くなり、コードが見やすくなる

**理由**: 大規模プロジェクトでの保守性とDX（開発者体験）の向上

---

## エラーハンドリング

### APIエラー

**ルール**: try-catchで包み、ユーザーフレンドリーなメッセージ
```typescript
try {
  const response = await fetch('/api/twitch/clips');
  if (!response.ok) {
    throw new Error('Failed to fetch clips');
  }
  const data = await response.json();
} catch (error) {
  setError('クリップの取得に失敗しました。もう一度お試しください。');
  console.error('Error fetching clips:', error);
}
```
**理由**: ユーザー体験を損なわず、デバッグ情報も保持

### 境界エラー

**ルール**: Error Boundaryで予期しないエラーをキャッチ
**理由**: アプリケーション全体のクラッシュを防ぐ

---

## パフォーマンス

### 画像最適化

**ルール**: Next.js の `Image` コンポーネントを使用
```typescript
import Image from 'next/image';

<Image
  src={clip.thumbnail_url}
  alt={clip.title}
  width={320}
  height={180}
  loading="lazy"
/>
```
**理由**: 自動最適化、遅延読み込み、レスポンシブ対応

### コンポーネント分割

**ルール**: 大きなコンポーネントは小さく分割
```typescript
// ❌ 1つの巨大コンポーネント
function HomePage() {
  return (
    <div>
      {/* 検索フォーム */}
      {/* クリップグリッド */}
      {/* フッター */}
    </div>
  );
}

// ✅ 分割
function HomePage() {
  return (
    <div>
      <SearchForm />
      <ClipGrid />
      <Footer />
    </div>
  );
}
```
**理由**: 再レンダリングを最小化、再利用性向上

---

## セキュリティ

### 環境変数の保護

**ルール**: クライアントに公開しない
```typescript
// ❌ クライアントで使用
const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;

// ✅ サーバーサイドのみ
// app/api/twitch/auth/route.ts
const clientId = process.env.TWITCH_CLIENT_ID;
const clientSecret = process.env.TWITCH_CLIENT_SECRET;
```
**理由**: APIキーの漏洩を防ぐ

### 入力検証

**ルール**: すべてのユーザー入力を検証
```typescript
if (!username || username.trim().length === 0) {
  return { error: 'Username is required' };
}

if (username.length > 25) {
  return { error: 'Username is too long' };
}
```
**理由**: 不正な入力からアプリケーションを保護

### Claude Code設定ファイルの管理

**⚠️ 重要**: `.claude/settings.local.json` には**絶対に機密情報を含めない**

**問題のある例:**
```json
{
  "permissions": {
    "allow": [
      "Bash(DATABASE_URL=\"postgresql://user:PASSWORD@host:5432/db\" command:*)"
    ]
  }
}
```

**ルール:**
1. **環境変数を直接コマンドに含めない**
   - ❌ `DATABASE_URL="postgresql://..."` をコマンドに埋め込む
   - ✅ `.env.local` に環境変数を定義し、そこから読み込む

2. **承認が必要なコマンドパターン:**
   - ✅ `Bash(npm install:*)` - 安全
   - ✅ `Bash(git add:*)` - 安全
   - ❌ `Bash(DATABASE_URL="..." command:*)` - 機密情報含む、承認禁止

3. **.gitignoreに必ず追加:**
   ```gitignore
   # Claude Code settings (contains sensitive data)
   .claude/settings.local.json
   ```

4. **万が一コミットしてしまった場合:**
   ```bash
   # 1. Gitトラッキングから削除
   git rm --cached .claude/settings.local.json

   # 2. コミット
   git commit -m "Security: Remove sensitive file"

   # 3. プッシュ
   git push

   # 4. データベースパスワードを変更（必須）
   ```

**理由**:
- Claude Code設定ファイルに機密情報を記録すると、誤ってGitにコミットされるリスクがある
- GitHubに公開されると、データベースが不正アクセスされる可能性がある
- 個人開発でも、リポジトリが公開設定の場合は危険

---

## Claude Skills使用ガイドライン

### Claude Skillsとは

**定義**: `.claude/skills/` に定義された、特定のタスクに特化したスキル
- `component-creator` - Reactコンポーネント作成
- `api-creator` - API Route作成
- `type-definer` - TypeScript型定義作成
- `page-creator` - Next.jsページ作成

**理由**: 一貫性のある実装を自動化し、DEVELOPMENT_RULESの遵守を保証

### スキル使用ルール

**ルール1**: 機能実装前にどのスキルを使用するか明示する
```
✅ 例: 「component-creatorスキルを使用してClipCardコンポーネントを作成」
```
**理由**: 適用されるルールセットを明確化

**ルール2**: スキル実行時に適用されるDEVELOPMENT_RULESセクションを確認する
```
✅ 例: 「component-creator適用ルール:
  - セクション4.1: ファイル命名規則（kebab-case）
  - セクション4.6: コンポーネント構造
  - セクション8.2: Props型定義」
```
**理由**: ルールの意識的な適用で一貫性を保つ

**ルール3**: スキルで対応できない場合は手動実装し、ルールを明示する
**理由**: 例外的な実装でもルールを遵守

### スキル選択基準

| タスク | 使用スキル | 理由 |
|--------|-----------|------|
| Reactコンポーネント作成 | component-creator | コンポーネント構造の統一 |
| API Route作成 | api-creator | エラーハンドリングの統一 |
| TypeScript型定義 | type-definer | 型定義の配置・命名の統一 |
| Next.jsページ作成 | page-creator | ページ構造の統一 |

---

---

## Next.js App Router ベストプラクティス（必須）

### サーバー/クライアントコンポーネント分離

**必須ルール**: すべての `app/` 配下の `page.tsx` はサーバーコンポーネントとして作成

#### ✅ 正しいパターン

```typescript
// app/dashboard/page.tsx (Server Component)
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { ROUTES } from '@/lib/constants';

export default async function DashboardPage() {
  // サーバー側で認証チェック
  const session = await auth();

  if (!session?.user) {
    redirect(ROUTES.LOGIN);
  }

  // propsでデータを渡す
  return <DashboardContent userId={session.user.id!} userName={session.user.name!} />;
}
```

```typescript
// components/dashboard/dashboard-content.tsx (Client Component)
'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';

interface DashboardContentProps {
  userId: string;
  userName: string;
}

export function DashboardContent({ userId, userName }: DashboardContentProps) {
  const [data, setData] = useState([]);
  // インタラクティブなUI

  return (
    <div>
      <Header />
      <DashboardSidebar />
      {/* ... */}
    </div>
  );
}
```

#### ❌ 間違ったパターン

```typescript
// ❌ app/dashboard/page.tsx に 'use client' を書かない！
'use client';

export default function DashboardPage() {
  // クライアント側で認証チェック（非推奨）
  const { data: session } = useSession();
  // ...
}
```

**理由**:
- サーバー側での認証チェックでセキュリティ向上
- JavaScriptバンドルサイズ削減
- 初回レンダリング高速化
- SEO向上

### コンポーネント分割の基準

**分割すべきケース**:
- 50行を超える UI セクション
- 再利用可能な UI パターン
- 独立した責務を持つ部分

**例: Settings ページの構造**
```
app/settings/page.tsx (40行, Server)
  └─ components/settings/settings-content.tsx (80行, Client)
      ├─ display-name-section.tsx (90行, サーバーアクション使用)
      ├─ account-info-section.tsx (40行, 表示のみ)
      └─ danger-zone-section.tsx (90行, サーバーアクション使用)
```

---

## サーバーアクション

### 使用すべきケース

- フォーム送信
- データベース更新
- セキュアな処理が必要な操作

### 実装パターン

```typescript
// actions/user.ts
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

export async function updateDisplayName(name: string): Promise<ActionResult> {
  try {
    // 1. 認証チェック
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: '認証が必要です', error: 'Unauthorized' };
    }

    // 2. バリデーション
    const validation = validateDisplayName(name);
    if (!validation.success) {
      return { success: false, message: validation.error!, error: 'Validation failed' };
    }

    // 3. データベース更新
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: name.trim() },
    });

    // 4. キャッシュ再検証
    revalidatePath('/settings');
    revalidatePath('/dashboard');

    return { success: true, message: '表示名を更新しました' };
  } catch (error) {
    console.error('Update display name error:', error);
    return { success: false, message: '表示名の更新に失敗しました', error: 'Internal server error' };
  }
}
```

### クライアント側での使用

```typescript
'use client';

import { useState, useTransition } from 'react';
import { updateDisplayName } from '@/actions/user';

export function DisplayNameForm({ currentName }: { currentName: string }) {
  const [name, setName] = useState(currentName);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await updateDisplayName(name);

      if (result.success) {
        // 成功処理
        setToast({ message: result.message, type: 'success' });
      } else {
        // エラー処理
        setToast({ message: result.message, type: 'error' });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button disabled={isPending}>
        {isPending ? '更新中...' : '更新'}
      </button>
    </form>
  );
}
```

**理由**:
- API Routes (`/api/user/update`) が不要
- セキュアなサーバー側処理
- `useTransition` で pending 状態管理
- `revalidatePath` で自動キャッシュ更新

---

## カスタムフックによるロジック分離

### 作成すべきケース

- 複雑なビジネスロジック
- 複数のステートと副作用を持つ処理
- 他のコンポーネントでも再利用可能なロジック

### 実装例

```typescript
// hooks/use-dashboard-clips.ts
import { useState, useEffect } from 'react';
import type { TwitchClip } from '@/types/twitch';
import type { SortType } from '@/components/dashboard/clip-sort-tabs';
import { API_ENDPOINTS } from '@/lib/constants';

export function useDashboardClips() {
  const [allClips, setAllClips] = useState<TwitchClip[]>([]);
  const [filteredClips, setFilteredClips] = useState<TwitchClip[]>([]);
  const [isLoadingClips, setIsLoadingClips] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState<SortType>('views');
  const [likedClipIds, setLikedClipIds] = useState<Set<string>>(new Set());

  const fetchAllFavoriteClips = async () => {
    setIsLoadingClips(true);
    try {
      const response = await fetch(API_ENDPOINTS.CLIPS.FAVORITES);
      const { data } = await response.json();
      setAllClips(data || []);
    } catch (error) {
      console.error('Fetch clips error:', error);
    } finally {
      setIsLoadingClips(false);
    }
  };

  const applyFiltersAndSort = () => {
    let result = [...allClips];

    // 検索フィルター
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(clip =>
        clip.title.toLowerCase().includes(query)
      );
    }

    // ソート
    if (sortType === 'views') {
      result.sort((a, b) => b.view_count - a.view_count);
    }

    setFilteredClips(result);
  };

  useEffect(() => {
    applyFiltersAndSort();
  }, [allClips, searchQuery, sortType]);

  return {
    filteredClips,
    isLoadingClips,
    searchQuery,
    sortType,
    likedClipIds,
    setSearchQuery,
    setSortType,
    fetchAllFavoriteClips,
  };
}
```

### カスタムフックを作成しないケース

- 単純な UI state (`isSidebarOpen` など)
- コンポーネント固有のローカル state
- 1つのコンポーネント内でのみ使用するハンドラ

---

## バリデーション（二段階チェック）

### 共通バリデーションの配置

```typescript
// lib/validations/user.ts
export interface ValidationResult {
  success: boolean;
  error?: string;
}

export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim().length === 0) {
    return { success: false, error: 'メールアドレスを入力してください' };
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    return { success: false, error: '有効なメールアドレスを入力してください' };
  }

  return { success: true };
}

export function validateDisplayName(name: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { success: false, error: '名前を入力してください' };
  }

  if (name.trim().length > 50) {
    return { success: false, error: '名前は50文字以内で入力してください' };
  }

  return { success: true };
}
```

### 二段階チェックの実装

1. **クライアント側**: ユーザー体験向上（即座にフィードバック）
2. **サーバー側**: セキュリティ担保（必須）

```typescript
// クライアント側
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // クライアント側バリデーション
  const validation = validateDisplayName(name);
  if (!validation.success) {
    setError(validation.error!);
    return;
  }

  // サーバーアクション呼び出し
  const result = await updateDisplayName(name);
};

// サーバー側（actions/user.ts）
export async function updateDisplayName(name: string): Promise<ActionResult> {
  // サーバー側バリデーション（必須）
  const validation = validateDisplayName(name);
  if (!validation.success) {
    return { success: false, message: validation.error! };
  }
  // ...
}
```

---

## 定数管理（DRY原則）

### constants.ts の構造

```typescript
// lib/constants.ts
export const APP_CONFIG = {
  name: 'Twitch Clip Viewer',
  description: 'お気に入りの配信者のクリップを見つけよう',
  version: '1.0.0',
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  FAVORITES_CLIPS: '/favorites-clips',
  SETTINGS: '/settings',
} as const;

export const API_ENDPOINTS = {
  FAVORITES: '/api/favorites',
  CLIPS: {
    FAVORITES: '/api/clips/favorites',
  },
  LIKED_CLIPS: {
    BASE: '/api/liked-clips',
    BY_ID: (clipId: string) => `/api/liked-clips/${clipId}`,
  },
} as const;

export const LABELS = {
  BUTTONS: {
    LOGIN: 'ログイン',
    LOGOUT: 'ログアウト',
    SAVE: '保存',
    DELETE: '削除',
  },
  SECTIONS: {
    SEARCH_STREAMERS: '配信者を検索して追加',
    FAVORITE_STREAMERS: 'お気に入り配信者',
  },
  MESSAGES: {
    LOADING: '読み込み中...',
  },
} as const;

export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  NAME_MAX_LENGTH: 50,
  EMAIL_REGEX: /\S+@\S+\.\S+/,
} as const;
```

### 使用例

```typescript
import { APP_CONFIG, ROUTES, LABELS } from '@/lib/constants';

// ✅ Good - 定数使用
<h1>{APP_CONFIG.name}</h1>
<Link href={ROUTES.DASHBOARD}>ダッシュボード</Link>
<button>{LABELS.BUTTONS.LOGIN}</button>

// ❌ Bad - ハードコード
<h1>Twitch Clip Viewer</h1>
<Link href="/dashboard">ダッシュボード</Link>
<button>ログイン</button>
```

**理由**: 一箇所で管理することで、テキスト変更が容易、タイポ防止、保守性向上

---

## ファイル命名規則（厳守）

- **ページ**: `page.tsx` (固定)
- **コンポーネント**: `kebab-case.tsx` (例: `dashboard-content.tsx`, `display-name-section.tsx`)
- **フック**: `use-feature.ts` (例: `use-dashboard-clips.ts`)
- **アクション**: `feature.ts` (例: `user.ts` in `actions/`)
- **型定義**: `feature.ts` (例: `twitch.ts`, `database.ts`)
- **バリデーション**: `feature.ts` (例: `user.ts` in `lib/validations/`)

---

## 新機能実装時のチェックリスト

新しい機能を追加する際は、以下の段階別チェックリストを順守してください。

### 📋 実装前（計画段階）

**ルール理解とセキュリティ確認:**
- [ ] CLAUDE.md全体と該当する `.claude/skills/` を読み、適用ルールを理解した
- [ ] 使用するSkill名（該当する場合）と適用ルール（セクション番号）を明確にした
- [ ] 機密情報（APIキー・パスワード・トークン等）を扱う場合、適切な管理方法を確認した
- [ ] セキュリティリスク（XSS・SQLインジェクション・認証バイパス等）がないか検討した

**設計確認:**
- [ ] ディレクトリ構造に従った配置を計画した
- [ ] 既存コンポーネント/関数の再利用を検討した
- [ ] 新規作成が必要なファイルをリストアップした

### 💻 実装中（コーディング段階）

**Next.js App Router ルール:**
- [ ] `page.tsx` はサーバーコンポーネントになっているか
- [ ] 認証チェックはサーバー側（`page.tsx`）で行っているか
- [ ] メインUIは `[feature]-content.tsx` として分離されているか
- [ ] 50行を超えるセクションは独立コンポーネント化されているか

**コーディング規約:**
- [ ] ファイル命名規則に従っているか（kebab-case.tsx）
- [ ] コンポーネント名はPascalCaseか
- [ ] 関数名はcamelCaseか
- [ ] 定数はUPPER_SNAKE_CASEか
- [ ] import順序は正しいか（React → 外部lib → 内部comp → utils/types）

**型定義とバリデーション:**
- [ ] 型定義は `types/` に適切に配置されているか
- [ ] Props型を定義しているか
- [ ] バリデーションはクライアント・サーバー両方で実装しているか（`lib/validations/`）

**状態管理とロジック:**
- [ ] 複雑なロジックはカスタムフックに分離されているか（`hooks/use-*.ts`）
- [ ] データベース更新はサーバーアクションを使用しているか（`actions/*.ts`）
- [ ] 定数は `constants.ts` で管理しているか

**UI/UX:**
- [ ] shadcn/uiコンポーネントを優先的に使用しているか
- [ ] レスポンシブデザイン（モバイルファースト）に対応しているか
- [ ] エラーハンドリングは適切か（try-catch、ユーザーフレンドリーなメッセージ）
- [ ] ローディング状態を表示しているか

**パフォーマンスとセキュリティ:**
- [ ] 画像は `next/image` を使用しているか
- [ ] 環境変数はサーバーサイドのみで参照しているか（`NEXT_PUBLIC_` 不使用）
- [ ] ユーザー入力を検証しているか

### ✅ PR提出前（最終確認）

**セキュリティ再確認:**
- [ ] コード・設定・コミット履歴に機密情報が含まれていないか確認した
- [ ] `.env.local` をGitにコミットしていないか確認した
- [ ] `.claude/settings.local.json` に機密情報が含まれていないか確認した

**Git操作:**
- [ ] コミットメッセージは明確で分かりやすいか
- [ ] 不要なファイル（node_modules、.DS_Store等）が含まれていないか
- [ ] `main` ブランチへの直接プッシュでないか確認した
- [ ] ブランチ名は機能を表しているか（例: `feature/clip-search`, `fix/auth-bug`）

**PR説明:**
- [ ] PR説明に以下を明記したか:
  - 使用したSkill名（該当する場合）
  - 適用したCLAUDE.mdのルール（セクション番号と内容）
  - 適用理由と期待される結果
  - スクリーンショット（UI変更の場合）
- [ ] レビュアーが理解しやすい説明になっているか

**動作確認:**
- [ ] ローカルで動作確認した
- [ ] エラーが発生しないか確認した
- [ ] 既存機能に影響がないか確認した

---

## まとめ

このドキュメントは、プロジェクトの一貫性と品質を保つためのものです。
すべてのルールには明確な理由があり、それを理解することで、より良いコードを書くことができます。

### 🔴 絶対厳守事項（再確認）

1. **セキュリティ最優先**
   - 機密情報を**絶対に**コード・設定・PRに含めない
   - 環境変数は `.env.local` で管理し、Gitにコミットしない
   - `.claude/settings.local.json` に機密情報を含めない

2. **勝手プッシュ厳禁**
   - `main` ブランチへの直接プッシュは**絶対禁止**
   - すべての変更は Plan → Implementation → Review → PR → Merge

3. **実装前に必読**
   - CLAUDE.md全体と該当 Skills を読んでから実装開始
   - どのルールをなぜ適用するか説明できない作業はしない

4. **PR時の宣言義務**
   - 使用したSkill名・適用ルール・理由を必ず明記

### ⚙️ 技術的重要ポイント

- **page.tsx は必ずサーバーコンポーネント**
- **認証チェックはサーバー側で完結**
- **データベース更新はサーバーアクション**
- **定数は constants.ts で一元管理**
- **バリデーションはクライアント・サーバー両方で実装**
- **型定義は types/ に集約**

### 📝 疑問・提案がある場合

- このドキュメントを更新し、チーム全体で共有してください
- セキュリティに関わる疑問は**必ず実装前に**確認してください
- ルールが不明確な場合は、実装前に明確化してください。

---

**最終更新**: 2025-11-01
**バージョン**: 3.0.0
