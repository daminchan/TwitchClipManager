# プロジェクト開発ガイドライン

## 📋 目次
1. [概要](#概要)
2. [開発フローの基本](#開発フローの基本)
3. [ディレクトリ構造](#ディレクトリ構造)
4. [Server/Client分離パターン](#serverclient分離パターン)
5. [サーバーアクション](#サーバーアクション)
6. [カスタムフック化の基準](#カスタムフック化の基準)
7. [コンポーネント分割とリファクタリング](#コンポーネント分割とリファクタリング)
8. [型定義の統一](#型定義の統一)
9. [定数管理](#定数管理)
10. [ファイル命名規則](#ファイル命名規則)
11. [適用するSkillsとルール](#適用するskillsとルール)
12. [実装例（Before/After）](#実装例beforeafter)

---

## 概要

### このドキュメントの目的
- **誰が見てもClaudeを使って同じクオリティでコーディングできる**ようにする
- Next.js 16 App Routerのベストプラクティスに準拠した開発手法を標準化
- 実装時の判断基準を明確化し、一貫性のあるコードベースを維持

### 対象読者
- このプロジェクトに新規参加する開発者
- Claudeを使用してコーディングを行う開発者
- プロジェクトのコード規約を理解したい開発者

---

## 開発フローの基本

### 実装の手順（必須）

```
1. DEVELOPMENT_RULES.md を読み込み、理解する
   ↓
2. PROJECT_GUIDELINES.md（本ファイル）を読み込み、開発方針を把握
   ↓
3. 実装対象のファイルを読み込む
   ↓
4. 該当する Skills と Rules を特定
   ↓
5. 実装時に必ず理由をコメントで明記
   ↓
6. コード冒頭に適用した Skills と Rules を記載
```

### コメント記載例

```typescript
// 適用スキル: page-creator
// 適用ルール:
// - セクション3: ディレクトリ構造
// - セクション10.2: サーバー/クライアントコンポーネント分離
// - Next.js App Router ベストプラクティス

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
```

**理由**: トレーサビリティ確保、将来の開発者がコードの意図を理解しやすくする

---

## ディレクトリ構造

### 基本構造

```
app/
├── [feature]/
│   └── page.tsx                    # Server Component（必須）
│
components/
├── [feature]/
│   ├── [feature]-content.tsx      # Client Component（メインUI）
│   ├── [feature]-section.tsx      # セクション分割（50行超え時）
│   └── [sub-component].tsx
│
actions/
├── [feature].ts                    # Server Actions
│
hooks/
├── use-[feature].ts                # Custom Hooks
│
lib/
├── constants.ts                    # 定数管理
├── validations/
│   └── [feature].ts                # バリデーション
└── [utility].ts                    # 共通ロジック
│
types/
├── index.ts                        # バレルエクスポート
├── database.ts                     # DB型定義
├── api.ts                          # API型定義
└── [feature].ts                    # 機能別型定義
```

### 実際の実装例

```
app/
├── dashboard/
│   └── page.tsx                    # Server: 認証チェック
│
components/
├── dashboard/
│   ├── dashboard-content.tsx      # Client: メインUI
│   ├── dashboard-sidebar.tsx      # Client: サイドバー
│   └── clip-sort-tabs.tsx         # Client: ソートタブ
│
actions/
├── favorites.ts                    # Server Actions: お気に入り操作
├── liked-clips.ts                  # Server Actions: いいね操作
└── user.ts                         # Server Actions: ユーザー操作
│
hooks/
└── use-dashboard-clips.ts          # Custom Hook: クリップロジック
```

### ディレクトリ構造の理由

| ディレクトリ | 理由 |
|------------|------|
| `app/[feature]/page.tsx` | Next.js 16 App Routerの規約、SEO最適化、サーバー側認証 |
| `components/[feature]/` | 機能ごとにグルーピング、保守性向上 |
| `actions/` | サーバーアクションを集約、型安全性、セキュリティ |
| `hooks/` | ビジネスロジック分離、再利用性、テスタビリティ |
| `lib/` | 共通ロジック・定数の一元管理 |
| `types/` | 型定義の一元管理、型安全性確保 |

---

## Server/Client分離パターン

### ✅ 必須ルール: すべての `page.tsx` はサーバーコンポーネント

```typescript
// ❌ Bad: page.tsx に 'use client'
'use client';

export default function DashboardPage() {
  const { data: session } = useSession();
  // ...
}
```

```typescript
// ✅ Good: page.tsx はサーバーコンポーネント
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { DashboardContent } from '@/components/dashboard/dashboard-content';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return <DashboardContent userId={session.user.id} />;
}
```

**理由**:
- **セキュリティ**: 認証チェックがサーバー側で行われ、クライアント側で改ざんできない
- **パフォーマンス**: 初回レンダリングがサーバー側で完了、FCP/LCP改善
- **SEO**: サーバーサイドレンダリングによるクローラー対応

### Server vs Client の責務分離

| 責務 | Server Component | Client Component |
|-----|------------------|------------------|
| 認証チェック | ✅ `await auth()` | ❌ |
| データベースアクセス | ✅ Prisma直接呼び出し | ❌ |
| リダイレクト | ✅ `redirect()` | ❌ |
| 環境変数アクセス | ✅ `process.env` | ❌ |
| useState/useEffect | ❌ | ✅ |
| イベントハンドラー | ❌ | ✅ |
| インタラクティブUI | ❌ | ✅ |
| ブラウザAPI | ❌ | ✅ |

### 分離パターンの実装フロー

```
app/[feature]/page.tsx (Server Component)
  │
  ├─ await auth()                    # 認証チェック
  ├─ redirect() if !authenticated    # リダイレクト
  ├─ データ取得（必要に応じて）
  │
  └─ return <FeatureContent props={data} />
       │
       └─ components/[feature]/[feature]-content.tsx (Client Component)
            │
            ├─ 'use client'
            ├─ useState, useEffect
            ├─ イベントハンドラー
            └─ サーバーアクション呼び出し
```

**理由**: 責務を明確に分離することで、セキュリティ向上、保守性向上、テストしやすさ向上

---

## サーバーアクション

### サーバーアクションを使うべきケース

✅ **使う**:
- データベースの作成・更新・削除（mutation）
- 認証が必要な操作
- セキュアな処理（環境変数を使う処理）
- フォーム送信

❌ **使わない**（API Routeを使う）:
- 外部APIへのプロキシ（Twitch APIなど）
- Webhookの受信
- サードパーティサービスとの連携

### サーバーアクションの実装パターン

```typescript
// actions/[feature].ts
'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validate[Feature] } from '@/lib/validations/[feature]';

export interface ActionResult {
  success: boolean;
  message: string;
  error?: string;
}

export async function [actionName](data: InputType): Promise<ActionResult> {
  try {
    // 1. 認証チェック
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: '認証が必要です', error: 'Unauthorized' };
    }

    // 2. バリデーション
    const validation = validate[Feature](data);
    if (!validation.success) {
      return { success: false, message: validation.error!, error: 'Validation failed' };
    }

    // 3. データベース操作
    await prisma.[model].create({ data: { ...data } });

    // 4. キャッシュ再検証
    revalidatePath('/[feature]');

    return { success: true, message: '成功しました' };
  } catch (error) {
    console.error('[Action] error:', error);
    return { success: false, message: '処理に失敗しました', error: 'Internal server error' };
  }
}
```

### クライアント側での使用

```typescript
'use client';

import { useTransition } from 'react';
import { [actionName] } from '@/actions/[feature]';

export function FeatureComponent() {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await [actionName](data);

      if (result.success) {
        // 成功処理
      } else {
        // エラー処理
      }
    });
  };

  return (
    <button onClick={handleSubmit} disabled={isPending}>
      {isPending ? '処理中...' : '送信'}
    </button>
  );
}
```

### サーバーアクションの理由

| 項目 | API Route | Server Action |
|-----|-----------|---------------|
| エンドポイント管理 | 必要（URL定義） | 不要（関数呼び出し） |
| 型安全性 | 低い（JSON型推論） | 高い（TypeScript直接） |
| キャッシュ再検証 | 手動 | `revalidatePath()`で自動 |
| コード量 | 多い | 少ない |
| セキュリティ | 同等 | 同等 |

**理由**: サーバーアクションは型安全性が高く、コードが簡潔で、Next.jsのキャッシュ機構と統合されているため、mutationにはサーバーアクションを使用

---

## カスタムフック化の基準

### フック化すべきケース

✅ **フック化する**:
- 複数の `useState` と `useEffect` が組み合わさっている（3つ以上）
- 複雑なビジネスロジック（100行以上）
- 複数のコンポーネントで再利用される可能性がある
- テストしやすくしたいロジック

❌ **フック化しない**:
- 単純な `useState` 1つだけ
- コンポーネント固有のUIロジック
- 再利用の可能性が低い

### カスタムフックの実装パターン

```typescript
// hooks/use-[feature].ts
import { useState, useEffect } from 'react';
import { get[Feature], add[Feature] } from '@/actions/[feature]';

export function use[Feature]() {
  const [data, setData] = useState<Type[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // データ取得
  const fetchData = async () => {
    setIsLoading(true);
    const result = await get[Feature]();
    if (result.success) {
      setData(result.data);
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  };

  // データ追加
  const addData = async (item: Type) => {
    const result = await add[Feature](item);
    if (result.success) {
      setData([...data, item]);
    }
    return result;
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    isLoading,
    error,
    fetchData,
    addData,
  };
}
```

### カスタムフック化の理由

| 理由 | 説明 |
|-----|------|
| **保守性** | ビジネスロジックをコンポーネントから分離、修正箇所が明確 |
| **再利用性** | 複数のコンポーネントで同じロジックを使用可能 |
| **テスタビリティ** | フック単体でのテストが容易 |
| **可読性** | コンポーネントがUIロジックに集中できる |

**基準**: 3つ以上の state または複雑なロジック（100行以上）がある場合はフック化

---

## コンポーネント分割とリファクタリング

### コンポーネント分割の基準

**50行を超えるセクションは分割する**

```typescript
// ❌ Bad: 1つのコンポーネントに全て詰め込む（200行）
export function SettingsContent() {
  return (
    <div>
      {/* 表示名変更: 90行 */}
      {/* アカウント情報: 40行 */}
      {/* アカウント削除: 90行 */}
    </div>
  );
}
```

```typescript
// ✅ Good: セクションごとに分割
export function SettingsContent() {
  return (
    <div>
      <DisplayNameSection />      {/* 90行 */}
      <AccountInfoSection />       {/* 40行 */}
      <DangerZoneSection />        {/* 90行 */}
    </div>
  );
}
```

### 分割パターン

```
components/[feature]/
├── [feature]-content.tsx          # メインコンポーネント（親）
├── [section]-section.tsx          # セクション分割（50行超え）
└── [sub-component].tsx            # サブコンポーネント
```

### リファクタリングのトリガー

| 条件 | アクション |
|-----|-----------|
| コンポーネントが50行超え | セクションに分割 |
| 同じコードが2箇所以上 | 共通コンポーネント化 |
| ビジネスロジックが複雑 | カスタムフック化 |
| 文字列がハードコード | constants.ts に移動 |

### 分割の理由

**理由**:
- **可読性**: 1ファイル50行以下なら全体を把握しやすい
- **保守性**: 修正範囲が明確、影響範囲が限定的
- **再利用性**: 小さいコンポーネントは他でも使いやすい
- **テスト性**: 小さい単位でテストしやすい

---

## 型定義の統一

### 型定義の配置ルール

```
types/
├── index.ts              # バレルエクスポート
├── database.ts           # Prismaスキーマ対応型
├── api.ts                # APIレスポンス型
├── auth.ts               # NextAuth型拡張
└── [feature].ts          # 機能別型定義
```

### Props型の命名規則

```typescript
// ✅ Good: 一貫した命名
interface [ComponentName]Props {
  userId: string;
  userName: string;
}

export function [ComponentName]({ userId, userName }: [ComponentName]Props) {
  // ...
}
```

### 型定義パターン

#### 1. Database型（types/database.ts）

```typescript
/**
 * データベース関連の型定義
 * Prisma スキーマに対応するアプリケーション層の型
 */

export interface FavoriteStreamer {
  id: string;
  streamerId: string;
  streamerName: string;
  streamerLogin: string;
  streamerImage?: string | null;
  createdAt: Date | string;
}
```

#### 2. API型（types/api.ts）

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
```

#### 3. バレルエクスポート（types/index.ts）

```typescript
/**
 * 型定義の集約ファイル（バレルエクスポート）
 * 使用例: import { TwitchClip, FavoriteStreamer } from '@/types';
 */

export * from './twitch';
export * from './auth';
export * from './database';
export * from './api';
```

### 型定義統一の理由

| 項目 | 理由 |
|-----|------|
| Props型命名 | 統一性、検索性、可読性 |
| types/分離 | 関心の分離、再利用性 |
| バレルエクスポート | インポート簡潔化、型の発見性向上 |
| interface使用 | 拡張可能性、エラーメッセージが分かりやすい |

---

## 定数管理

### lib/constants.ts での一元管理

**すべての定数・テキスト・ラベルを `lib/constants.ts` で管理**

#### 管理する定数の種類

```typescript
// lib/constants.ts

// 1. ルート定義
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  SETTINGS: '/settings',
} as const;

// 2. API エンドポイント
export const API_ENDPOINTS = {
  FAVORITES: '/api/favorites',
  CLIPS: {
    FAVORITES: '/api/clips/favorites',
  },
} as const;

// 3. UI テキスト・ラベル
export const LABELS = {
  BUTTONS: {
    LOGIN: 'ログイン',
    SIGNUP: '新規登録',
    SUBMIT: '送信',
    CANCEL: 'キャンセル',
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
} as const;

// 4. バリデーション定数
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  NAME_MAX_LENGTH: 50,
  EMAIL_REGEX: /\S+@\S+\.\S+/,
} as const;

// 5. タイミング設定
export const TIMING = {
  TOAST_DURATION: 3000,
  REDIRECT_DELAY: 1500,
} as const;
```

### 使用例

```typescript
// ❌ Bad: ハードコード
<button>送信</button>
<p>保存しました</p>
router.push('/dashboard');

// ✅ Good: constants.ts を使用
import { LABELS, ROUTES } from '@/lib/constants';

<button>{LABELS.BUTTONS.SUBMIT}</button>
<p>{LABELS.MESSAGES.SUCCESS}</p>
router.push(ROUTES.DASHBOARD);
```

### 定数管理の理由

| 理由 | 説明 | 具体例 |
|-----|------|--------|
| **変更漏れ防止** | 1箇所変更で全体に反映 | 「送信」→「Submit」に変更時、constants.tsのみ修正 |
| **タイポ防止** | 定数参照のため、タイポがコンパイルエラーになる | `ROUTES.DASHBORD` → エラー検知 |
| **多言語対応準備** | 将来的にi18n対応が容易 | `LABELS.ja.SUBMIT`, `LABELS.en.SUBMIT` |
| **検索性向上** | 「ログイン」の文字列を変更したい時、constants.tsを見るだけ | `LABELS.BUTTONS.LOGIN` で一発検索 |
| **マジックナンバー排除** | 数値の意味が明確 | `setTimeout(fn, 3000)` → `TIMING.TOAST_DURATION` |

### `as const` の重要性

```typescript
// ❌ Bad: as const がない
export const ROUTES = {
  HOME: '/',
};
// 型: { HOME: string } → 変更可能

// ✅ Good: as const
export const ROUTES = {
  HOME: '/',
} as const;
// 型: { readonly HOME: '/' } → 変更不可、リテラル型
```

**理由**: `as const` により、定数が truly immutable になり、型推論がリテラル型になる

---

## ファイル命名規則

### 命名規則の統一

| ファイルタイプ | 命名規則 | 例 |
|---------------|---------|-----|
| ページ | `page.tsx` | `app/dashboard/page.tsx` |
| レイアウト | `layout.tsx` | `app/layout.tsx` |
| コンポーネント | `[feature]-[type].tsx` | `dashboard-content.tsx` |
| サーバーアクション | `[feature].ts` | `actions/favorites.ts` |
| カスタムフック | `use-[feature].ts` | `hooks/use-dashboard-clips.ts` |
| ユーティリティ | `[name].ts` | `lib/utils.ts` |
| 型定義 | `[name].ts` | `types/database.ts` |
| バリデーション | `[feature].ts` | `lib/validations/user.ts` |

### ケーススタイル

- **ファイル名**: `kebab-case`（ハイフン区切り）
- **コンポーネント名**: `PascalCase`
- **関数名**: `camelCase`
- **定数名**: `UPPER_SNAKE_CASE` または `camelCase`（オブジェクト内）

### 命名例

```typescript
// ファイル名: dashboard-content.tsx
export function DashboardContent() { }  // PascalCase

// ファイル名: use-dashboard-clips.ts
export function useDashboardClips() { }  // camelCase

// ファイル名: constants.ts
export const API_ENDPOINTS = { };  // UPPER_SNAKE_CASE
export const ROUTES = { };
```

### 命名規則の理由

| 理由 | 説明 |
|-----|------|
| **Next.js規約** | `page.tsx`, `layout.tsx` はNext.jsの規約 |
| **可読性** | kebab-caseは単語の区切りが明確 |
| **一貫性** | プロジェクト全体で統一されたスタイル |
| **検索性** | 命名規則が統一されていると、ファイル検索が容易 |

---

## 適用するSkillsとルール

### DEVELOPMENT_RULES.md と Skills の違い

#### 概要

新規プロジェクトでは、**DEVELOPMENT_RULES.md** と **.claude/skills/** の両方を最初に作成する必要があります。
このセクションでは、それぞれの役割と記載内容の違いを明確化します。

#### 役割の違い

| 項目 | DEVELOPMENT_RULES.md | Skills (.claude/skills/) |
|-----|---------------------|-------------------------|
| **What（何を）** | プロジェクト全体のアーキテクチャルール | タスク別の実装手順 |
| **Why（なぜ）** | ルールの理由と目的を記載 | 実装の方法とステップを記載 |
| **When（いつ）** | プロジェクト全体で常に適用 | 特定のタスク実行時に適用 |
| **視点** | アーキテクト視点（全体設計） | 実装者視点（具体的手順） |
| **更新頻度** | 低い（アーキテクチャ変更時のみ） | 中程度（実装パターン追加時） |

#### DEVELOPMENT_RULES.md に記載すべき内容

**プロジェクト全体に適用される普遍的なルール**

✅ **記載する内容**:
- 技術スタック選定理由
- ディレクトリ構造とその理由
- 命名規則（kebab-case, PascalCase等）
- Server/Client分離の原則
- 定数管理の方針
- バリデーション戦略
- エラーハンドリング方針
- セキュリティガイドライン
- パフォーマンス最適化指針

**例**:
```markdown
## ディレクトリ構造

### ルール3: ビジネスロジックは `lib/` に配置
**理由**: コンポーネントから分離し、テスタビリティを向上

## Server/Client分離

### 必須ルール: すべての `page.tsx` はサーバーコンポーネント
**理由**: セキュリティ向上、パフォーマンス向上、SEO対応
```

#### Skills に記載すべき内容

**特定のタスクを実行するための具体的な手順**

✅ **記載する内容**:
- タスクの目的
- 実装する具体的なステップ（1, 2, 3...）
- ファイル作成手順
- コード記載例
- チェックリスト
- 関連するDEVELOPMENT_RULESのセクション参照

**例**:
```markdown
# page-creator スキル

## 目的
Next.js App Router のページを作成する

## 実装ステップ

1. `app/[feature]/page.tsx` を作成（サーバーコンポーネント）
   - `await auth()` で認証チェック
   - `redirect()` で未認証時リダイレクト

2. `components/[feature]/[feature]-content.tsx` を作成（クライアント）
   - `'use client'` ディレクティブ
   - Props型を定義

3. 適用ルールをコメント記載
   - セクション10.2: Server/Client分離
```

#### 具体例による比較

##### 例: Server/Client分離

**DEVELOPMENT_RULES.md に記載**:
```markdown
## Server/Client分離

### 必須ルール: すべての page.tsx はサーバーコンポーネント

**理由**:
- セキュリティ: 認証チェックがサーバー側で完結
- パフォーマンス: 初回レンダリング高速化
- SEO: サーバーサイドレンダリング

### 責務分離

| 責務 | Server | Client |
|-----|--------|--------|
| 認証チェック | ✅ | ❌ |
| useState | ❌ | ✅ |
```

**Skills (.claude/skills/page-creator.md) に記載**:
```markdown
# page-creator

## 手順

1. `app/[feature]/page.tsx` 作成
   ```typescript
   import { redirect } from 'next/navigation';
   import { auth } from '@/lib/auth';

   export default async function FeaturePage() {
     const session = await auth();
     if (!session?.user) redirect('/login');
     return <FeatureContent userId={session.user.id} />;
   }
   ```

2. `components/[feature]/[feature]-content.tsx` 作成
   ```typescript
   'use client';

   interface FeatureContentProps {
     userId: string;
   }

   export function FeatureContent({ userId }: FeatureContentProps) {
     // ...
   }
   ```

3. コメント記載
   ```typescript
   // 適用スキル: page-creator
   // 適用ルール: セクション10.2 Server/Client分離
   ```
```

#### 新規プロジェクト立ち上げ時のフロー

```
1. DEVELOPMENT_RULES.md を作成
   ↓
   - プロジェクトのアーキテクチャ方針を決定
   - 技術スタック、ディレクトリ構造、命名規則を定義
   - 各ルールの理由を明記

2. Skills を作成
   ↓
   - よく使うタスクを洗い出す
   - 各タスクの実装手順を記載
   - DEVELOPMENT_RULES.mdのセクションを参照

3. PROJECT_GUIDELINES.md を作成（オプション）
   ↓
   - 開発フローの全体像を記載
   - Before/After例を追加
   - 新規参加者向けのガイド
```

#### 判断基準表

| 記載内容 | DEVELOPMENT_RULES.md | Skills |
|---------|---------------------|--------|
| 命名規則（kebab-case等） | ✅ | ❌ |
| ディレクトリ構造 | ✅ | ❌ |
| Server/Client分離の理由 | ✅ | ❌ |
| ページ作成の手順 | ❌ | ✅ page-creator |
| コンポーネント作成の手順 | ❌ | ✅ component-creator |
| API作成の手順 | ❌ | ✅ api-creator |
| 型定義の配置理由 | ✅ | ❌ |
| 型定義作成の手順 | ❌ | ✅ type-definer |
| 定数管理の方針 | ✅ | ❌ |
| 50行分割ルール | ✅ | ❌ |
| 50行分割の具体的手順 | ❌ | ✅ component-creator |

#### まとめ

- **DEVELOPMENT_RULES.md**: 「なぜこうするのか」「プロジェクト全体の設計思想」
- **Skills**: 「どうやって実装するのか」「具体的な手順」

両方を整備することで、**一貫性のあるコードベース**と**効率的な開発フロー**が実現できます。

---

### Skills一覧

#### 1. page-creator
**使用タイミング**: 新しいページを作成する時

**適用内容**:
- `app/[feature]/page.tsx` をサーバーコンポーネントとして作成
- `await auth()` でサーバー側認証チェック
- `components/[feature]/[feature]-content.tsx` にクライアントコンポーネントを分離

**理由**: Next.js 16 App Routerのベストプラクティスに準拠、セキュリティとパフォーマンスの向上

#### 2. component-creator
**使用タイミング**: 新しいコンポーネントを作成する時

**適用内容**:
- Props型を `interface [ComponentName]Props` で定義
- 50行を超える場合はセクション分割
- `'use client'` の必要性を判断

**理由**: 型安全性、保守性、可読性の向上

### DEVELOPMENT_RULES.md セクション対応表

| セクション | 内容 | 適用タイミング |
|-----------|------|---------------|
| セクション3 | ディレクトリ構造 | 全ファイル作成時 |
| セクション4.6 | コンポーネント構造 | コンポーネント作成時 |
| セクション8.2 | Props型定義 | コンポーネント作成時 |
| セクション10.2 | Server/Client分離 | ページ作成時 |
| セクション11 | サーバーアクション | データ更新処理実装時 |

### 実装時のチェックリスト

**ページ作成時**:
- [ ] `page.tsx` に `'use client'` を書いていないか
- [ ] サーバー側で認証チェックを行っているか
- [ ] クライアントコンポーネントは `[feature]-content.tsx` 形式か
- [ ] 適用したSkillsとRulesをコメントで明記したか

**コンポーネント作成時**:
- [ ] Props型を定義したか
- [ ] 50行を超える場合は分割したか
- [ ] 定数は `constants.ts` から取得しているか
- [ ] 適用したSkillsとRulesをコメントで明記したか

**サーバーアクション実装時**:
- [ ] `'use server'` ディレクティブを記載したか
- [ ] 認証チェックを実装したか
- [ ] バリデーションを実装したか
- [ ] `revalidatePath()` でキャッシュ再検証を実装したか
- [ ] ActionResult型を返却しているか

---

## 実装例（Before/After）

### 例1: ページのServer/Client分離

#### ❌ Before（問題点）

```typescript
// app/dashboard/page.tsx
'use client';  // ← NG: page.tsx に 'use client'

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const { data: session, status } = useSession();  // ← クライアント側認証
  const router = useRouter();
  const [clips, setClips] = useState([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');  // ← クライアント側リダイレクト
    }
  }, [status]);

  // 200行のUIロジック...
}
```

**問題点**:
- ❌ page.tsx がクライアントコンポーネント（ベストプラクティス違反）
- ❌ 認証チェックがクライアント側（セキュリティリスク）
- ❌ 1ファイルに全ロジックが詰まっている（保守性低い）

#### ✅ After（改善後）

```typescript
// app/dashboard/page.tsx
// 適用スキル: page-creator
// 適用ルール:
// - Next.js App Router ベストプラクティス
// - セクション10.2: サーバー/クライアントコンポーネント分離

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { ROUTES } from '@/lib/constants';

/**
 * ダッシュボードページ（サーバーコンポーネント）
 * サーバー側で認証チェックを行い、UIはクライアントコンポーネントに委譲
 */
export default async function DashboardPage() {
  // サーバー側で認証チェック
  const session = await auth();

  // 未認証の場合はログインページにリダイレクト
  if (!session?.user) {
    redirect(ROUTES.LOGIN);
  }

  // 認証済みユーザーの情報をクライアントコンポーネントに渡す
  return (
    <DashboardContent
      userId={session.user.id!}
      userEmail={session.user.email!}
    />
  );
}
```

```typescript
// components/dashboard/dashboard-content.tsx
// 適用スキル: component-creator
// 適用ルール:
// - セクション4.6: コンポーネント構造
// - セクション10.2: サーバー/クライアントコンポーネント分離

'use client';

import { useState, useEffect } from 'react';
import { useDashboardClips } from '@/hooks/use-dashboard-clips';

interface DashboardContentProps {
  userId: string;
  userEmail: string;
}

export function DashboardContent({ userId, userEmail }: DashboardContentProps) {
  const { clips, isLoading, fetchClips } = useDashboardClips();

  useEffect(() => {
    fetchClips();
  }, []);

  return (
    <div>
      {/* UIロジック */}
    </div>
  );
}
```

**改善点**:
- ✅ page.tsx がサーバーコンポーネント（ベストプラクティス準拠）
- ✅ サーバー側で認証チェック（セキュリティ向上）
- ✅ Server/Client責務分離（保守性向上）
- ✅ 適用ルールが明記されている（トレーサビリティ）

---

### 例2: API RouteからServer Actionへの移行

#### ❌ Before（API Route使用）

```typescript
// app/api/favorites/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { streamerId, streamerName } = body;

    await prisma.favoriteStreamer.create({
      data: { userId: session.user.id, streamerId, streamerName },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

```typescript
// components/dashboard/dashboard-sidebar.tsx
const handleAddFavorite = async (streamer) => {
  const response = await fetch('/api/favorites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      streamerId: streamer.id,
      streamerName: streamer.name,
    }),
  });

  if (!response.ok) {
    alert('エラーが発生しました');
  }
};
```

**問題点**:
- ❌ APIエンドポイント管理が必要
- ❌ 型安全性が低い（JSON型推論）
- ❌ キャッシュ再検証を手動で行う必要がある

#### ✅ After（Server Action使用）

```typescript
// actions/favorites.ts
// 適用ルール:
// - セクション11: サーバーアクション

'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export interface ActionResult {
  success: boolean;
  message: string;
  error?: string;
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
    // 1. 認証チェック
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: '認証が必要です',
        error: 'Unauthorized'
      };
    }

    // 2. バリデーション
    if (!streamerId || !streamerName || !streamerLogin) {
      return {
        success: false,
        message: '必須項目が不足しています',
        error: 'Missing required fields'
      };
    }

    // 3. データベース操作
    await prisma.favoriteStreamer.create({
      data: {
        userId: session.user.id,
        streamerId,
        streamerName,
        streamerLogin,
        streamerImage: streamerImage || null,
      },
    });

    // 4. キャッシュ再検証
    revalidatePath('/dashboard');

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
```

```typescript
// components/dashboard/dashboard-sidebar.tsx
'use client';

import { useTransition } from 'react';
import { addFavoriteStreamer } from '@/actions/favorites';

export function DashboardSidebar() {
  const [isPending, startTransition] = useTransition();

  const handleAddFavorite = (streamer) => {
    startTransition(async () => {
      const result = await addFavoriteStreamer(
        streamer.id,
        streamer.name,
        streamer.login,
        streamer.image
      );

      if (result.success) {
        // 成功処理
      } else {
        alert(result.message);
      }
    });
  };

  return (
    <button onClick={handleAddFavorite} disabled={isPending}>
      {isPending ? '追加中...' : '追加'}
    </button>
  );
}
```

**改善点**:
- ✅ 型安全性向上（TypeScript直接呼び出し）
- ✅ エンドポイント管理不要
- ✅ `revalidatePath()` で自動キャッシュ再検証
- ✅ コード量削減
- ✅ `useTransition` で pending state 管理

---

### 例3: 定数管理（テキスト一元化）

#### ❌ Before（ハードコード）

```typescript
// components/auth/login-form.tsx
<button>ログイン</button>
<input placeholder="your@email.com" />
<p>メールアドレスを入力してください</p>

// components/settings/display-name-section.tsx
<button>更新</button>
<p>保存しました</p>

// components/dashboard/dashboard-content.tsx
<button>ログイン</button>  // ← タイポ: ログイン → ログイソ
```

**問題点**:
- ❌ Aは「ログイン」→「Login」に変更したが、Bは変更忘れ
- ❌ タイポが実行時まで検知できない
- ❌ 多言語対応が困難

#### ✅ After（constants.ts で管理）

```typescript
// lib/constants.ts
export const LABELS = {
  BUTTONS: {
    LOGIN: 'ログイン',
    SIGNUP: '新規登録',
    SAVE: '保存',
    UPDATE: '更新',
  },
  MESSAGES: {
    SUCCESS: '保存しました',
    ERROR: 'エラーが発生しました',
  },
  PLACEHOLDERS: {
    EMAIL: 'your@email.com',
  },
  FORM: {
    EMAIL_REQUIRED: 'メールアドレスを入力してください',
  },
} as const;
```

```typescript
// components/auth/login-form.tsx
import { LABELS } from '@/lib/constants';

<button>{LABELS.BUTTONS.LOGIN}</button>
<input placeholder={LABELS.PLACEHOLDERS.EMAIL} />
<p>{LABELS.FORM.EMAIL_REQUIRED}</p>
```

```typescript
// components/settings/display-name-section.tsx
import { LABELS } from '@/lib/constants';

<button>{LABELS.BUTTONS.UPDATE}</button>
<p>{LABELS.MESSAGES.SUCCESS}</p>
```

```typescript
// components/dashboard/dashboard-content.tsx
import { LABELS } from '@/lib/constants';

<button>{LABELS.BUTTONS.LOGIN}</button>  // ← タイポは型エラーで検知
```

**改善点**:
- ✅ 1箇所変更で全体に反映（変更漏れ防止）
- ✅ タイポがコンパイルエラーで検知される
- ✅ 多言語対応が容易（将来的に `LABELS.ja`, `LABELS.en` に拡張可能）
- ✅ 全テキストを一覧できる（constants.ts を見るだけ）

---

## まとめ

### 開発の基本原則

1. **DEVELOPMENT_RULES.md とこのファイルを必ず読む**
2. **適用するSkillsとRulesを明記する**
3. **Server/Client分離を厳守する**
4. **サーバーアクションでmutationを行う**
5. **定数・テキストは constants.ts で管理**
6. **50行を超えたら分割する**
7. **型安全性を確保する**

### このガイドラインの目的

- ✅ **誰が見ても同じクオリティでコーディングできる**
- ✅ **Claudeを使って効率的に開発できる**
- ✅ **一貫性のあるコードベースを維持できる**
- ✅ **保守性・可読性・拡張性が高いコードを書ける**

### 困ったときは

1. このファイル（PROJECT_GUIDELINES.md）を読む
2. DEVELOPMENT_RULES.md を読む
3. 既存の実装例を参照する
4. Skillsファイル（.claude/skills/）を確認する

---

**バージョン**: 1.0.0
**最終更新**: 2025-10-29
