---
description: Create Next.js pages following DEVELOPMENT_RULES.md standards
enabled: true
---

# Page Creator Skill

このスキルは、DEVELOPMENT_RULESに準拠したNext.js App Routerページを作成します。

## 必須ルール

### 1. page.tsx は必ずサーバーコンポーネント
- **ルール**: `app/` 配下の `page.tsx` には `'use client'` を書かない
- **理由**: セキュリティ、パフォーマンス、SEO向上

### 2. サーバー/クライアント分離パターン
```
app/[feature]/page.tsx (Server Component)
  ├─ 認証チェック (await auth())
  ├─ データ取得（必要に応じて）
  └─ propsでクライアントコンポーネントに渡す
      ↓
components/[feature]/[feature]-content.tsx (Client Component)
  ├─ 'use client' ディレクティブ
  ├─ インタラクティブなUI
  └─ useStateなどのフック使用
```

## 実装パターン

### パターン1: 認証が必要なページ

```typescript
// app/dashboard/page.tsx (Server Component)
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { ROUTES } from '@/lib/constants';

/**
 * ダッシュボードページ（サーバーコンポーネント）
 *
 * サーバー側で:
 * - 認証チェック
 * - ユーザー情報の取得
 *
 * クライアント側(DashboardContent)で:
 * - インタラクティブなUI
 * - データフェッチ
 * - 状態管理
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

### パターン2: ログインページ（既に認証済みならリダイレクト）

```typescript
// app/login/page.tsx (Server Component)
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { LoginForm } from '@/components/auth/login-form';
import { ROUTES } from '@/lib/constants';

/**
 * ログインページ（サーバーコンポーネント）
 *
 * サーバー側で:
 * - 認証済みかチェック
 * - 認証済みならダッシュボードへリダイレクト
 *
 * クライアント側(LoginForm)で:
 * - ログイン/サインアップフォーム
 * - バリデーション
 * - 認証処理
 */
export default async function LoginPage() {
  // サーバー側で認証チェック
  const session = await auth();

  // すでにログイン済みの場合はダッシュボードへ
  if (session?.user) {
    redirect(ROUTES.DASHBOARD);
  }

  // 未認証ユーザーにはログインフォームを表示
  return <LoginForm />;
}
```

## クライアントコンポーネントの作成

### 基本構造

```typescript
// components/dashboard/dashboard-content.tsx
'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';

interface DashboardContentProps {
  userId: string;
  userEmail: string;
}

export function DashboardContent({ userId, userEmail }: DashboardContentProps) {
  const [data, setData] = useState([]);

  // インタラクティブなUI実装
  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Header />
      <div className="flex">
        <DashboardSidebar />
        <main>{/* コンテンツ */}</main>
      </div>
    </div>
  );
}
```

## コンポーネント分割基準

**50行を超える場合は分割する**:

```
app/settings/page.tsx (40行, Server)
  └─ components/settings/settings-content.tsx (80行, Client)
      ├─ display-name-section.tsx (90行)
      ├─ account-info-section.tsx (40行)
      └─ danger-zone-section.tsx (90行)
```

## 適用ルール（DEVELOPMENT_RULES参照）

### セクション1: ディレクトリ構造
- `app/[feature]/page.tsx` はサーバーコンポーネント
- `components/[feature]/[feature]-content.tsx` はクライアントコンポーネント

### セクション2: サーバー/クライアント分離
- 認証チェックはサーバー側
- データベースアクセスはサーバー側
- useState/useEffectはクライアント側

### セクション3: 定数管理
- ルート: `ROUTES` から取得
- ラベル: `LABELS` から取得
- エンドポイント: `API_ENDPOINTS` から取得

### セクション4: 型定義
- Props型は必ず定義
- `interface [ComponentName]Props` の形式

## チェックリスト

新しいページを作成する際の確認事項:

- [ ] page.tsx に `'use client'` を書いていないか
- [ ] 認証チェックをサーバー側で行っているか
- [ ] propsで必要なデータを渡しているか
- [ ] クライアントコンポーネントは `[feature]-content.tsx` 形式か
- [ ] 定数を constants.ts から取得しているか
- [ ] Props型を定義しているか
- [ ] コメントで責務を明記しているか

## 使用例

### ダッシュボードページ作成
```
1. app/dashboard/page.tsx を作成（Server Component）
2. components/dashboard/dashboard-content.tsx を作成（Client Component）
3. 必要に応じてサブコンポーネント分割
   - dashboard-sidebar.tsx
   - clip-sort-tabs.tsx
```

### 設定ページ作成
```
1. app/settings/page.tsx を作成（Server Component）
2. components/settings/settings-content.tsx を作成（Client Component）
3. セクションごとに分割
   - display-name-section.tsx
   - account-info-section.tsx
   - danger-zone-section.tsx
```

## 参考: DEVELOPMENT_RULES

詳細は DEVELOPMENT_RULES.md の以下セクションを参照:
- **Next.js App Router ベストプラクティス（必須）**
- **サーバーアクション**
- **定数管理（DRY原則）**
- **ファイル命名規則（厳守）**
