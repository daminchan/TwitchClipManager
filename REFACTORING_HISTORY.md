# リファクタリング履歴

## 📋 目次
1. [概要](#概要)
2. [定数管理の導入](#定数管理の導入)
3. [Server/Client分離パターンの適用](#serverclient分離パターンの適用)
4. [サーバーアクションへの移行](#サーバーアクションへの移行)
5. [カスタムフック化](#カスタムフック化)
6. [コンポーネント分割](#コンポーネント分割)
7. [不要ファイルの削除](#不要ファイルの削除)

---

## 概要

### リファクタリングの目的
- Next.js 16 App Routerのベストプラクティスに準拠
- 保守性・可読性・拡張性の向上
- セキュリティとパフォーマンスの最適化

### 実施期間
2025-10-29

### 主な変更内容
1. 定数管理の導入（テキスト一元化）
2. page.tsx のサーバーコンポーネント化
3. API RouteからServer Actionへの移行
4. カスタムフックによるロジック分離
5. コンポーネント分割（50行基準）

---

## 定数管理の導入

### 問題点

**Before**: 各コンポーネントでテキストをハードコード

```typescript
// components/layout/header.tsx
<h1>Twitch Clip Viewer</h1>

// components/layout/mobile-nav.tsx
<h1>Twitch Clip Viewer</h1>  // ← 同じテキストを2箇所で記述

// components/streamers/streamer-search.tsx
<label>配信者を検索</label>

// components/dashboard/dashboard-sidebar.tsx
<h2>配信者を検索して追加</h2>  // ← 微妙に文言が違う
```

**課題**:
- ❌ アプリ名変更時、すべてのコンポーネントを修正する必要がある
- ❌ Web版とモバイル版で文言が異なる可能性（修正漏れ）
- ❌ 「配信者を検索」→「配信者を検索して追加」に変更したい時、複数箇所を修正
- ❌ タイポのリスク（実行時まで検知できない）

### 解決策

**After**: `lib/constants.ts` で一元管理

```typescript
// lib/constants.ts
export const APP_CONFIG = {
  name: 'Twitch Clip Viewer',
  shortName: 'Clip Viewer',
  description: 'お気に入りの配信者のクリップを見つけよう',
} as const;

export const LABELS = {
  SECTIONS: {
    SEARCH_STREAMERS: '配信者を検索して追加',
    FAVORITE_STREAMERS: 'お気に入り配信者',
  },
  BUTTONS: {
    LOGIN: 'ログイン',
    SUBMIT: '送信',
  },
  MESSAGES: {
    SUCCESS: '保存しました',
    ERROR: 'エラーが発生しました',
  },
} as const;
```

```typescript
// components/layout/header.tsx
import { APP_CONFIG } from '@/lib/constants';
<h1>{APP_CONFIG.name}</h1>

// components/layout/mobile-nav.tsx
import { APP_CONFIG } from '@/lib/constants';
<h1>{APP_CONFIG.name}</h1>

// components/streamers/streamer-search.tsx
import { LABELS } from '@/lib/constants';
<label>{LABELS.SECTIONS.SEARCH_STREAMERS}</label>

// components/dashboard/dashboard-sidebar.tsx
import { LABELS } from '@/lib/constants';
<h2>{LABELS.SECTIONS.SEARCH_STREAMERS}</h2>
```

### 改善効果

| 項目 | Before | After |
|-----|--------|-------|
| アプリ名変更 | 全コンポーネント修正 | constants.ts 1箇所のみ |
| 修正漏れリスク | 高い | なし（1箇所変更で全体反映） |
| タイポ検知 | 実行時エラー | コンパイル時エラー |
| 文言の統一 | 手動で確認必要 | 自動的に統一 |
| 多言語対応 | 困難 | 容易（将来的に拡張可能） |

### 変更理由

1. **修正漏れ防止**: Web版のヘッダーは変更したがモバイル版は変更忘れ、というミスを防ぐ
2. **保守性向上**: 1箇所変更するだけで全体に反映
3. **一貫性確保**: すべてのコンポーネントで同じ文言を使用
4. **拡張性**: 将来的に多言語対応（i18n）が容易

---

## Server/Client分離パターンの適用

### 問題点

**Before**: page.tsx がクライアントコンポーネント

```typescript
// app/dashboard/page.tsx
'use client';  // ← NG: page.tsx に 'use client'

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const { data: session, status } = useSession();  // クライアント側認証
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');  // クライアント側リダイレクト
    }
  }, [status]);

  // 270行のUIロジック...
  const [clips, setClips] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [toast, setToast] = useState(null);
  // ...すべてここに詰め込んでいた

  return (
    <div>
      {/* 大量のJSX */}
    </div>
  );
}
```

**課題**:
- ❌ Next.js 16のベストプラクティス違反（page.tsx はサーバーコンポーネント推奨）
- ❌ 認証チェックがクライアント側（セキュリティリスク）
- ❌ 1ファイルに270行（可読性が悪い）
- ❌ 責務が不明確（認証・UI・ビジネスロジックがすべて混在）

### 解決策

**After**: Server/Client責務分離

#### 1. page.tsx をサーバーコンポーネント化

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

#### 2. クライアントコンポーネント分離

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
  const [toast, setToast] = useState(null);

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

### 改善効果

| 項目 | Before | After |
|-----|--------|-------|
| 認証チェック | クライアント側 | サーバー側（安全） |
| ファイル行数 | 270行 | page.tsx: 30行, content: 100行 |
| セキュリティ | 低い | 高い |
| SEO | 不利 | 有利 |
| 初回表示速度 | 遅い | 速い |
| 責務分離 | なし | 明確 |

### 変更理由

**気づき**: 「そういえば page.tsx はサーバーコンポーネントにするのが基本だった」

1. **セキュリティ向上**: 認証チェックをサーバー側で行うことで、クライアント側で改ざんされるリスクを排除
2. **パフォーマンス向上**: サーバーサイドレンダリングにより、初回表示速度が向上
3. **可読性向上**: 270行 → 30行（page.tsx）+ 100行（content）に分割
4. **保守性向上**: Server/Client の責務が明確になり、修正箇所が特定しやすい

---

## サーバーアクションへの移行

### 問題点

**Before**: API RouteとfetchでmutationAPI Routeとfetchでmutation

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
    await prisma.favoriteStreamer.create({ data: { ...body } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
```

```typescript
// components/dashboard/dashboard-sidebar.tsx
const handleAdd = async () => {
  const response = await fetch('/api/favorites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ streamerId, streamerName }),
  });

  if (!response.ok) {
    alert('エラー');
  }
};
```

**課題**:
- ❌ APIエンドポイントの管理が必要（`/api/favorites`, `/api/liked-clips` など）
- ❌ 型安全性が低い（JSON型推論）
- ❌ キャッシュ再検証を手動で行う必要がある
- ❌ エラーハンドリングが煩雑

### 解決策

**After**: Server Actionで型安全なmutation

```typescript
// actions/favorites.ts
'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export interface ActionResult {
  success: boolean;
  message: string;
  error?: string;
}

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
      return { success: false, message: '認証が必要です', error: 'Unauthorized' };
    }

    // 2. バリデーション
    if (!streamerId || !streamerName) {
      return { success: false, message: '必須項目が不足しています', error: 'Validation failed' };
    }

    // 3. データベース操作
    await prisma.favoriteStreamer.create({
      data: { userId: session.user.id, streamerId, streamerName, streamerLogin, streamerImage },
    });

    // 4. キャッシュ再検証
    revalidatePath('/dashboard');

    return { success: true, message: 'お気に入りに追加しました' };
  } catch (error) {
    console.error('Add favorite error:', error);
    return { success: false, message: '追加に失敗しました', error: 'Internal server error' };
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

  const handleAdd = (streamer) => {
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
    <button onClick={handleAdd} disabled={isPending}>
      {isPending ? '追加中...' : '追加'}
    </button>
  );
}
```

### 改善効果

| 項目 | Before（API Route） | After（Server Action） |
|-----|---------------------|------------------------|
| エンドポイント管理 | 必要 | 不要 |
| 型安全性 | 低い | 高い |
| キャッシュ再検証 | 手動 | 自動（revalidatePath） |
| コード量 | 多い | 少ない |
| Pending状態 | 手動実装 | useTransitionで簡単 |

### 変更理由

1. **型安全性**: TypeScript関数として直接呼び出すため、型推論が効く
2. **シンプル化**: エンドポイントURL管理が不要
3. **自動キャッシュ再検証**: `revalidatePath()` で自動的にキャッシュを更新
4. **エラーハンドリング**: ActionResult型で統一的なエラー処理

### 移行したAPI

- ✅ `/api/user/update` → `actions/user.ts` の `updateDisplayName`
- ✅ `/api/user/delete` → `actions/user.ts` の `deleteAccount`
- ✅ `/api/favorites` → `actions/favorites.ts`
- ✅ `/api/liked-clips` → `actions/liked-clips.ts`

### 残したAPI Route（理由あり）

- ⚪ `/api/twitch/**` - 外部API（Twitch）へのプロキシ
- ⚪ `/api/auth/**` - NextAuth認証
- ⚪ `/api/clips/favorites` - Twitchからクリップ取得

**理由**: 外部APIとの連携や認証はAPI Routeが適切

---

## カスタムフック化

### 問題点

**Before**: コンポーネント内に複雑なビジネスロジック

```typescript
// components/dashboard/dashboard-content.tsx
export function DashboardContent() {
  const [allClips, setAllClips] = useState([]);
  const [filteredClips, setFilteredClips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState('views');
  const [likedClipIds, setLikedClipIds] = useState(new Set());

  // データ取得ロジック（30行）
  const fetchClips = async () => { /* ... */ };

  // いいね処理（40行）
  const handleLike = async () => { /* ... */ };

  // フィルター・ソートロジック（30行）
  useEffect(() => { /* ... */ }, [allClips, searchQuery, sortType]);

  // 合計100行以上のロジック...
}
```

**課題**:
- ❌ コンポーネントが肥大化（UIロジックとビジネスロジックが混在）
- ❌ 再利用できない
- ❌ テストしにくい

### 解決策

**After**: カスタムフックに分離

```typescript
// hooks/use-dashboard-clips.ts
import { useState, useEffect } from 'react';
import { getLikedClips, addLikedClip, removeLikedClip } from '@/actions/liked-clips';

export function useDashboardClips() {
  const [allClips, setAllClips] = useState([]);
  const [filteredClips, setFilteredClips] = useState([]);
  const [isLoadingClips, setIsLoadingClips] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState('views');
  const [likedClipIds, setLikedClipIds] = useState(new Set());

  const fetchAllFavoriteClips = async () => { /* ... */ };

  const fetchLikedClips = async () => {
    const result = await getLikedClips();
    if (result.success && result.data) {
      setLikedClipIds(new Set(result.data.map(clip => clip.clipId)));
    }
  };

  const handleLikeToggle = async (clipId, isLiked) => {
    if (isLiked) {
      return await removeLikedClip(clipId);
    } else {
      return await addLikedClip(clipData);
    }
  };

  const applyFiltersAndSort = () => { /* ... */ };

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
    fetchLikedClips,
    handleLikeToggle,
  };
}
```

```typescript
// components/dashboard/dashboard-content.tsx
export function DashboardContent() {
  const {
    filteredClips,
    isLoadingClips,
    searchQuery,
    setSearchQuery,
    handleLikeToggle,
  } = useDashboardClips();

  // UIロジックのみに集中
  return <div>{/* UI */}</div>;
}
```

### 改善効果

| 項目 | Before | After |
|-----|--------|-------|
| コンポーネント行数 | 200行 | 50行 |
| ビジネスロジック | コンポーネント内 | フック内（分離） |
| 再利用性 | 不可 | 可能 |
| テスタビリティ | 低い | 高い |

### 変更理由

1. **関心の分離**: UIロジックとビジネスロジックを分離
2. **再利用性**: 他のコンポーネントでも同じロジックを使用可能
3. **テスト性**: フック単体でテスト可能
4. **可読性**: コンポーネントがシンプルになる

---

## コンポーネント分割

### 問題点

**Before**: 1ファイルに全UIロジック

```typescript
// components/settings/settings-content.tsx
export function SettingsContent() {
  return (
    <div>
      {/* 表示名変更セクション: 90行 */}
      <Card>
        <form>{/* ... */}</form>
      </Card>

      {/* アカウント情報セクション: 40行 */}
      <Card>
        <div>{/* ... */}</div>
      </Card>

      {/* アカウント削除セクション: 90行 */}
      <Card>
        <button>{/* ... */}</button>
      </Card>
    </div>
  );
}
// 合計220行
```

**課題**:
- ❌ 1ファイルが220行（可読性が悪い）
- ❌ 各セクションの責務が不明確
- ❌ 部分的な再利用ができない

### 解決策

**After**: 50行基準でセクション分割

```typescript
// components/settings/settings-content.tsx（親コンポーネント）
export function SettingsContent({ userEmail, userName }) {
  const [toast, setToast] = useState(null);

  return (
    <div>
      <DisplayNameSection
        currentName={userName}
        onSuccess={(msg) => setToast({ message: msg, type: 'success' })}
        onError={(msg) => setToast({ message: msg, type: 'error' })}
      />

      <AccountInfoSection email={userEmail} name={userName} />

      <DangerZoneSection
        onSuccess={(msg) => setToast({ message: msg, type: 'success' })}
        onError={(msg) => setToast({ message: msg, type: 'error' })}
      />

      {toast && <Toast {...toast} />}
    </div>
  );
}
```

```typescript
// components/settings/display-name-section.tsx（90行）
export function DisplayNameSection({ currentName, onSuccess, onError }) {
  // 表示名変更ロジック
}
```

```typescript
// components/settings/account-info-section.tsx（40行）
export function AccountInfoSection({ email, name }) {
  // アカウント情報表示
}
```

```typescript
// components/settings/danger-zone-section.tsx（90行）
export function DangerZoneSection({ onSuccess, onError }) {
  // アカウント削除ロジック
}
```

### 改善効果

| 項目 | Before | After |
|-----|--------|-------|
| ファイル行数 | 220行 | 40行 + 90行 + 40行 + 90行 |
| 可読性 | 低い | 高い |
| 責務の明確さ | 不明確 | 明確 |
| 再利用性 | 低い | 高い |

### 分割基準

**50行を超えるセクションは分割**

```
components/[feature]/
├── [feature]-content.tsx          # 親コンポーネント（40行）
├── [section-1]-section.tsx        # セクション1（90行）
├── [section-2]-section.tsx        # セクション2（40行）
└── [section-3]-section.tsx        # セクション3（90行）
```

### 変更理由

1. **可読性**: 1ファイル50行前後なら全体を把握しやすい
2. **保守性**: 修正対象のファイルが明確
3. **責務の明確化**: 各セクションが独立した責務を持つ

---

## 不要ファイルの削除

### 削除したファイル一覧

#### 1. API Routes（Server Actionに移行）

```
削除:
- app/api/user/update/route.ts
- app/api/user/delete/route.ts
- app/api/favorites/route.ts
- app/api/liked-clips/route.ts
- app/api/liked-clips/[clipId]/route.ts

理由: actions/ ディレクトリのサーバーアクションに移行済み
```

#### 2. 空ディレクトリ

```
削除:
- app/api/user/
- app/api/liked-clips/
- app/api/favorites/

理由: 中身がなく不要
```

### 削除理由

| ファイル | 削除理由 | 移行先 |
|---------|---------|--------|
| `/api/user/update` | サーバーアクションに移行 | `actions/user.ts` |
| `/api/user/delete` | サーバーアクションに移行 | `actions/user.ts` |
| `/api/favorites` | サーバーアクションに移行 | `actions/favorites.ts` |
| `/api/liked-clips` | サーバーアクションに移行 | `actions/liked-clips.ts` |

---

## まとめ

### 主な成果

| 改善項目 | Before | After | 効果 |
|---------|--------|-------|------|
| 定数管理 | ハードコード | constants.ts | 修正漏れ防止 |
| page.tsx | Client Component | Server Component | セキュリティ向上 |
| 認証チェック | クライアント側 | サーバー側 | セキュリティ向上 |
| mutation処理 | API Route | Server Action | 型安全性・簡潔性 |
| ビジネスロジック | コンポーネント内 | Custom Hooks | 再利用性・テスト性 |
| コンポーネント | 220行 | 40〜90行に分割 | 可読性・保守性 |

### 得られた知見

1. **定数管理の重要性**
   - 文字列変更時の修正漏れを防ぐため、すべてのテキストを一元管理すべき
   - Web版とモバイル版で文言を統一しやすい

2. **Server/Client分離の効果**
   - page.tsx をサーバーコンポーネントにするだけで、セキュリティとパフォーマンスが大幅向上
   - 認証チェックは必ずサーバー側で行うべき

3. **Server Actionの威力**
   - API Routeよりも型安全で簡潔
   - キャッシュ再検証が自動化される

4. **50行ルールの有効性**
   - 1ファイル50行以下なら全体を把握しやすい
   - 責務が明確になり、保守性が向上

### 今後の方針

- ✅ 新規ページ作成時は必ず page-creator スキルを適用
- ✅ テキストは必ず constants.ts で管理
- ✅ mutationは Server Action を使用
- ✅ 50行を超えたら分割を検討
- ✅ PROJECT_GUIDELINES.md と DEVELOPMENT_RULES.md を常に参照

---

**作成日**: 2025-10-29
**作成者**: Development Team
