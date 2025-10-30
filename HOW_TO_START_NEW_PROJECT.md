# 新規プロジェクト立ち上げガイド

## 📋 目次
1. [概要](#概要)
2. [前提知識](#前提知識)
3. [ステップ1: DEVELOPMENT_RULES.md の作成](#ステップ1-development_rulesmd-の作成)
4. [ステップ2: Skills の作成](#ステップ2-skills-の作成)
5. [ステップ3: PROJECT_GUIDELINES.md の作成](#ステップ3-project_guidelinesmd-の作成)
6. [ステップ4: 定数管理の整備](#ステップ4-定数管理の整備)
7. [ステップ5: 型定義の整備](#ステップ5-型定義の整備)
8. [チェックリスト](#チェックリスト)
9. [Claudeへの指示例](#claudeへの指示例)

---

## 概要

### このドキュメントの目的

新規プロジェクトを立ち上げる際に、**一貫性のあるコードベース**と**効率的な開発フロー**を実現するためのドキュメントを整備する方法を示します。

### 対象読者

- 新しいプロジェクトを始める開発者
- Claudeを使って効率的に開発したい開発者
- プロジェクトのルールを最初から整備したい開発者

### なぜこのガイドが必要か

| 問題 | 解決策 |
|-----|-------|
| コードスタイルがバラバラ | DEVELOPMENT_RULES.mdで統一 |
| 実装方法が人によって異なる | Skillsで手順を標準化 |
| 文字列の変更漏れ（A変更、B忘れ） | constants.tsで一元管理 |
| 新規参加者が理解に時間がかかる | PROJECT_GUIDELINES.mdでガイド |

---

## 前提知識

### ドキュメントの役割

| ドキュメント | 役割 | Why/How |
|------------|------|---------|
| **DEVELOPMENT_RULES.md** | プロジェクト全体のアーキテクチャルール | Why（なぜこうするのか） |
| **Skills (.claude/skills/)** | タスク別の実装手順 | How（どうやって実装するのか） |
| **PROJECT_GUIDELINES.md** | 開発フローと全体像の解説 | Overview（全体像を把握） |
| **constants.ts** | 定数・テキストの一元管理 | DRY原則の実践 |

### 作成順序

```
1. DEVELOPMENT_RULES.md（必須）
   ↓ プロジェクトの設計思想

2. Skills（必須）
   ↓ 実装手順の標準化

3. PROJECT_GUIDELINES.md（推奨）
   ↓ 新規参加者向けガイド

4. constants.ts（必須）
   ↓ テキスト・定数の一元管理

5. types/index.ts（必須）
   ↓ 型定義のバレルエクスポート
```

---

## ステップ1: DEVELOPMENT_RULES.md の作成

### 作成内容

プロジェクト全体に適用される**アーキテクチャルールと理由**を記載します。

### 必須セクション

```markdown
# 開発ルール・ガイドライン

## 1. プロジェクト概要
- アプリケーション名
- 目的
- 技術スタック選定理由

## 2. ディレクトリ構造
- 基本構造
- 各ディレクトリの理由

## 3. コーディング規約
- ファイル命名規則（kebab-case等）
- コンポーネント命名規則（PascalCase等）
- インポート順序

## 4. Next.js App Router ベストプラクティス
- Server/Client分離の理由
- page.tsx は必ずサーバーコンポーネント
- 認証チェックはサーバー側

## 5. サーバーアクション
- 使用すべきケース
- 実装パターン
- 理由（型安全性、キャッシュ再検証）

## 6. カスタムフック化の基準
- フック化すべきケース
- フック化しないケース

## 7. 型定義
- 型定義の配置ルール
- バレルエクスポートの理由

## 8. 定数管理
- constants.ts での一元管理
- 変更漏れ防止の理由

## 9. エラーハンドリング
- 統一的なエラーレスポンス

## 10. セキュリティ
- 環境変数の保護
- 入力検証
```

### Claudeへの指示例

```
新規Next.js 16プロジェクトのDEVELOPMENT_RULES.mdを作成してください。

プロジェクト情報:
- 技術スタック: Next.js 16, TypeScript, Tailwind CSS, Prisma, NextAuth.js
- 目的: [プロジェクトの目的]
- 主な機能: [主な機能リスト]

以下のセクションを含めてください:
1. プロジェクト概要
2. 技術スタック（選定理由付き）
3. ディレクトリ構造（理由付き）
4. コーディング規約
5. Next.js App Routerベストプラクティス
6. サーバーアクション
7. カスタムフック化の基準
8. 型定義（バレルエクスポート含む）
9. 定数管理
10. エラーハンドリング
11. セキュリティ

各ルールには必ず**理由**を記載してください。
```

### 重要ポイント

✅ **必ず理由を書く**
```markdown
## ルール: page.tsx はサーバーコンポーネント

**理由**:
- セキュリティ: 認証チェックがサーバー側で完結
- パフォーマンス: 初回レンダリング高速化
- SEO: サーバーサイドレンダリング
```

❌ **理由がないのはNG**
```markdown
## ルール: page.tsx はサーバーコンポーネント

（理由なし）
```

---

## ステップ2: Skills の作成

### 作成内容

よく使うタスクの**具体的な実装手順**を記載します。

### 推奨Skillsファイル

```
.claude/skills/
├── page-creator.md          # ページ作成手順
├── component-creator.md     # コンポーネント作成手順
├── api-creator.md           # API Route作成手順
└── type-definer.md          # 型定義作成手順
```

### 例: page-creator.md

```markdown
# page-creator スキル

## 目的
Next.js App Router のページを作成する

## 適用ルール
- DEVELOPMENT_RULES.md セクション3: ディレクトリ構造
- DEVELOPMENT_RULES.md セクション4: Next.js App Routerベストプラクティス

## 実装ステップ

### 1. `app/[feature]/page.tsx` を作成（サーバーコンポーネント）

```typescript
// 適用スキル: page-creator
// 適用ルール:
// - セクション3: ディレクトリ構造
// - セクション4: Server/Client分離

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { FeatureContent } from '@/components/[feature]/[feature]-content';
import { ROUTES } from '@/lib/constants';

/**
 * [Feature]ページ（サーバーコンポーネント）
 *
 * サーバー側で:
 * - 認証チェック
 *
 * クライアント側(FeatureContent)で:
 * - インタラクティブなUI
 */
export default async function FeaturePage() {
  // サーバー側で認証チェック
  const session = await auth();

  // 未認証の場合はログインページにリダイレクト
  if (!session?.user) {
    redirect(ROUTES.LOGIN);
  }

  // 認証済みユーザーにはクライアントコンポーネントを表示
  return <FeatureContent userId={session.user.id!} />;
}
```

### 2. `components/[feature]/[feature]-content.tsx` を作成（クライアント）

```typescript
// 適用スキル: component-creator
// 適用ルール:
// - セクション4: Server/Client分離
// - セクション7: Props型定義

'use client';

import { useState, useEffect } from 'react';

interface FeatureContentProps {
  userId: string;
}

export function FeatureContent({ userId }: FeatureContentProps) {
  // インタラクティブなUIロジック

  return (
    <div>
      {/* UI */}
    </div>
  );
}
```

### 3. チェックリスト

- [ ] page.tsx に `'use client'` を書いていないか
- [ ] サーバー側で認証チェックを行っているか
- [ ] クライアントコンポーネントは `[feature]-content.tsx` 形式か
- [ ] 適用したSkillsとRulesをコメントで明記したか
- [ ] Props型を定義したか
```

### Claudeへの指示例

```
.claude/skills/ ディレクトリに以下のSkillsファイルを作成してください:

1. page-creator.md
   - Next.js App Routerのページ作成手順
   - Server/Client分離パターン
   - 認証チェックの実装

2. component-creator.md
   - Reactコンポーネント作成手順
   - Props型定義
   - 50行超えの分割基準

3. api-creator.md
   - API Route作成手順
   - エラーハンドリング
   - レスポンス形式

各Skillsには以下を含めてください:
- 目的
- 適用するDEVELOPMENT_RULESのセクション参照
- 具体的な実装ステップ（コード例付き）
- チェックリスト
```

---

## ステップ3: PROJECT_GUIDELINES.md の作成

### 作成内容

**開発フロー全体像**と**Before/After例**を記載します。

### 必須セクション

```markdown
# プロジェクト開発ガイドライン

## 1. 概要
- このドキュメントの目的
- 対象読者

## 2. 開発フローの基本
- 実装の手順（DEVELOPMENT_RULES.md → PROJECT_GUIDELINES.md → 実装）

## 3. ディレクトリ構造
- 基本構造
- 実際の実装例

## 4. Server/Client分離パターン
- 正しいパターン
- 間違ったパターン

## 5. サーバーアクション
- 使うべきケース
- 実装パターン

## 6. カスタムフック化の基準
- フック化すべきケース
- フック化しないケース

## 7. コンポーネント分割とリファクタリング
- 50行を超えたら分割

## 8. 型定義の統一
- バレルエクスポート

## 9. 定数管理
- constants.ts での一元管理
- 変更漏れ防止

## 10. DEVELOPMENT_RULES.md と Skills の違い
- 役割の違い
- 記載内容の違い
- 判断基準表

## 11. 実装例（Before/After）
- ページのServer/Client分離
- API RouteからServer Actionへの移行
- 定数管理（テキスト一元化）
```

### Claudeへの指示例

```
PROJECT_GUIDELINES.mdを作成してください。

内容:
1. 開発フロー全体像
2. Before/After実装例（最低3つ）
3. DEVELOPMENT_RULES.mdとSkillsの違い
4. 新規参加者向けガイド

Before/After例として以下を含めてください:
- page.tsxのServer/Client分離
- API RouteからServer Actionへの移行
- 定数管理（ハードコード → constants.ts）

このガイドラインを見れば、誰でもClaudeを使って同じクオリティでコーディングできるようにしてください。
```

---

## ステップ4: 定数管理の整備

### 作成内容

`lib/constants.ts` にすべての定数・テキスト・ラベルを一元管理します。

### 必須項目

```typescript
// lib/constants.ts

// 1. アプリケーション設定
export const APP_CONFIG = {
  name: 'Your App Name',
  description: 'Your app description',
  version: '1.0.0',
} as const;

// 2. ルート定義
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  SETTINGS: '/settings',
} as const;

// 3. APIエンドポイント
export const API_ENDPOINTS = {
  USERS: '/api/users',
  AUTH: '/api/auth',
} as const;

// 4. UIテキスト・ラベル
export const LABELS = {
  BUTTONS: {
    LOGIN: 'ログイン',
    SIGNUP: '新規登録',
    SUBMIT: '送信',
    CANCEL: 'キャンセル',
    SAVE: '保存',
    DELETE: '削除',
  },
  MESSAGES: {
    LOADING: '読み込み中...',
    SUCCESS: '保存しました',
    ERROR: 'エラーが発生しました',
  },
  PLACEHOLDERS: {
    EMAIL: 'your@email.com',
    PASSWORD: '6文字以上',
  },
  SECTIONS: {
    // セクションタイトル
  },
} as const;

// 5. バリデーション定数
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  NAME_MAX_LENGTH: 50,
  EMAIL_REGEX: /\S+@\S+\.\S+/,
} as const;

// 6. タイミング設定
export const TIMING = {
  TOAST_DURATION: 3000,
  REDIRECT_DELAY: 1500,
  DEBOUNCE_DELAY: 300,
} as const;
```

### Claudeへの指示例

```
lib/constants.ts を作成してください。

以下のカテゴリを含めてください:
1. APP_CONFIG（アプリ名、説明、バージョン）
2. ROUTES（すべてのルート定義）
3. API_ENDPOINTS（APIエンドポイント）
4. LABELS（UIテキスト、ボタンラベル、メッセージ、プレースホルダー）
5. VALIDATION（バリデーション定数）
6. TIMING（タイムアウト、遅延設定）

すべての定数に `as const` を付けてください。

目的: 文字列のハードコードを排除し、変更漏れ（A変更、B忘れ）を防ぐ
```

### 重要ポイント

✅ **`as const` を必ず付ける**
```typescript
export const ROUTES = {
  HOME: '/',
} as const;
// 型: { readonly HOME: '/' }
```

❌ **`as const` がないとNG**
```typescript
export const ROUTES = {
  HOME: '/',
};
// 型: { HOME: string } ← 変更可能
```

---

## ステップ5: 型定義の整備

### 作成内容

`types/` ディレクトリに型定義を配置し、`types/index.ts` でバレルエクスポートします。

### ディレクトリ構造

```
types/
├── index.ts           # バレルエクスポート
├── database.ts        # DB型定義
├── api.ts             # APIレスポンス型
├── auth.ts            # 認証関連型
└── [feature].ts       # 機能別型定義
```

### types/index.ts（バレルエクスポート）

```typescript
/**
 * 型定義の集約ファイル（バレルエクスポート）
 *
 * 使用例:
 * import type { User, TwitchClip, ApiResponse } from '@/types';
 *
 * メリット:
 * - Import文の簡潔化
 * - ファイル構成変更時の修正箇所が少ない
 * - パスの統一
 */

export * from './database';
export * from './api';
export * from './auth';
export * from './twitch';
```

### types/database.ts

```typescript
/**
 * データベース関連の型定義
 * Prisma スキーマに対応するアプリケーション層の型
 */

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date | string;
}

// その他のDB型
```

### types/api.ts

```typescript
/**
 * API レスポンスの共通型
 */

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  error: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

### Claudeへの指示例

```
types/ ディレクトリを整備してください。

1. types/index.ts を作成
   - すべての型定義をバレルエクスポート
   - コメントでメリットを記載

2. types/database.ts を作成
   - Prismaスキーマに対応する型定義

3. types/api.ts を作成
   - ApiResponse<T> 汎用型
   - ApiError型
   - PaginatedResponse<T> 型

4. types/auth.ts を作成
   - NextAuth型拡張

各ファイルに目的のコメントを記載してください。

使用例:
import type { User, ApiResponse, TwitchClip } from '@/types';
```

---

## チェックリスト

### プロジェクト立ち上げ時

- [ ] DEVELOPMENT_RULES.md を作成した
  - [ ] 全ルールに理由を記載した
  - [ ] ディレクトリ構造を定義した
  - [ ] Server/Client分離を説明した
  - [ ] サーバーアクションを説明した
  - [ ] 定数管理を説明した

- [ ] Skills を作成した
  - [ ] page-creator.md
  - [ ] component-creator.md
  - [ ] api-creator.md（必要に応じて）
  - [ ] type-definer.md（必要に応じて）

- [ ] PROJECT_GUIDELINES.md を作成した
  - [ ] 開発フロー全体像を記載した
  - [ ] Before/After例を3つ以上記載した
  - [ ] DEVELOPMENT_RULES.mdとSkillsの違いを説明した

- [ ] lib/constants.ts を作成した
  - [ ] APP_CONFIG を定義した
  - [ ] ROUTES を定義した
  - [ ] LABELS を定義した
  - [ ] すべてに `as const` を付けた

- [ ] types/ を整備した
  - [ ] types/index.ts（バレルエクスポート）を作成した
  - [ ] types/database.ts を作成した
  - [ ] types/api.ts を作成した

### 実装開始前

- [ ] DEVELOPMENT_RULES.md を読んだ
- [ ] PROJECT_GUIDELINES.md を読んだ
- [ ] 使用するSkillsを確認した
- [ ] constants.ts の内容を確認した

---

## Claudeへの指示例

### プロジェクト全体の初期化

```
新規Next.js 16プロジェクトのドキュメントを整備してください。

プロジェクト情報:
- 名前: [プロジェクト名]
- 目的: [目的]
- 技術スタック: Next.js 16, TypeScript, Tailwind CSS, Prisma, PostgreSQL, NextAuth.js

以下を順番に作成してください:

1. DEVELOPMENT_RULES.md
   - プロジェクト概要
   - 技術スタック（理由付き）
   - ディレクトリ構造（理由付き）
   - コーディング規約
   - Next.js App Routerベストプラクティス
   - サーバーアクション
   - カスタムフック化の基準
   - 型定義（バレルエクスポート）
   - 定数管理（変更漏れ防止）
   - エラーハンドリング
   - セキュリティ

2. .claude/skills/ 配下に以下を作成
   - page-creator.md
   - component-creator.md
   - api-creator.md

3. PROJECT_GUIDELINES.md
   - 開発フロー全体像
   - Before/After実装例（3つ以上）
   - DEVELOPMENT_RULES.mdとSkillsの違い

4. lib/constants.ts
   - APP_CONFIG, ROUTES, API_ENDPOINTS, LABELS, VALIDATION, TIMING
   - すべてに `as const`

5. types/index.ts（バレルエクスポート）
   - types/database.ts, types/api.ts, types/auth.ts

すべてのファイルに目的と理由のコメントを記載してください。
```

### 既存プロジェクトへの適用

```
既存プロジェクトにドキュメントを追加してください。

現在の状況:
- 技術スタック: [既存のスタック]
- 主な機能: [機能リスト]
- 問題点:
  - コードスタイルが統一されていない
  - 文字列がハードコードされている
  - 新規参加者が理解に時間がかかる

以下を作成してください:

1. DEVELOPMENT_RULES.md
   - 既存のコードベースを分析
   - 現在のパターンをルール化
   - 理由を明記

2. PROJECT_GUIDELINES.md
   - 既存の実装をBefore/After例として記載

3. lib/constants.ts
   - 既存の文字列リテラルを抽出
   - 定数化

4. types/index.ts
   - 既存の型定義をバレル化

各ファイルに、既存コードをどのように改善するかを記載してください。
```

---

## まとめ

### このガイドで達成できること

✅ **一貫性のあるコードベース**
- すべてのページがServer/Client分離パターンに準拠
- 命名規則が統一
- 型定義が一元管理

✅ **効率的な開発フロー**
- Skillsで実装手順が標準化
- constants.tsで変更漏れ防止
- Claudeを使った効率的な開発

✅ **新規参加者のオンボーディング短縮**
- DEVELOPMENT_RULES.mdで設計思想を理解
- PROJECT_GUIDELINES.mdで実装例を参照
- Skillsで具体的な手順を確認

### 次のステップ

1. このガイドに従ってドキュメントを作成
2. 最初の機能を実装（Skillsに従って）
3. チームメンバーにレビュー依頼
4. フィードバックを反映してドキュメント更新

### 困ったときは

- DEVELOPMENT_RULES.md を見る → なぜこうするのか
- Skills を見る → どうやって実装するのか
- PROJECT_GUIDELINES.md を見る → 全体像を把握

---

**バージョン**: 1.0.0
**最終更新**: 2025-10-29
