# Twitch Clip Viewer - ついっぷ
あとで自分で確認する用


お気に入りの配信者のクリップを人気順で表示するWebアプリケーション

---

## 目次

1. [アプリ概要](#アプリ概要)
2. [技術スタック](#技術スタック)
3. [アーキテクチャ](#アーキテクチャ)
4. [クリップ取得の仕組み](#クリップ取得の仕組み)
5. [データフロー](#データフロー)
6. [楽観的UI更新](#楽観的ui更新)
7. [キャッシュ戦略](#キャッシュ戦略)
8. [データベース設計](#データベース設計)
9. [認証フロー](#認証フロー)
10. [パフォーマンス最適化](#パフォーマンス最適化)
11. [セットアップ](#セットアップ)

---

## アプリ概要

### 解決する課題

Twitchには膨大なクリップがあり、お気に入りの配信者のクリップを効率的に見つけるのが難しい。本アプリは：

- 複数の配信者のクリップを**一括取得**
- **直近48時間**の新鮮なクリップに絞り込み
- **再生数順**で人気クリップを優先表示
- **フォルダ機能**で配信者をグループ化してフィルタリング

### 主要機能

| 機能 | 説明 |
|------|------|
| 配信者検索・追加 | Twitch APIで配信者を検索してお気に入りに追加 |
| ゲームから配信者追加 | 人気ゲームから配信者をレコメンド |
| クリップ一覧 | お気に入り配信者のクリップを再生数順で表示 |
| いいね機能 | クリップをお気に入り保存（楽観的UI） |
| フォルダ管理 | 配信者をフォルダでグループ化 |
| ライブ表示 | 配信中の配信者をリアルタイム表示 |

---

## 技術スタック

### フロントエンド

| 技術 | 用途 | 選定理由 |
|------|------|----------|
| **Next.js 16** (App Router) | フレームワーク | Server ComponentsによるSSR、API Routes統合 |
| **TypeScript** | 型安全性 | 開発時のエラー検出、IDE補完 |
| **Tailwind CSS** | スタイリング | ユーティリティファースト、高速開発 |
| **shadcn/ui** | UIコンポーネント | カスタマイズ可能、アクセシビリティ対応 |
| **React Query (TanStack Query)** | サーバー状態管理 | キャッシュ、楽観的UI、自動再取得 |
| **dnd-kit** | ドラッグ&ドロップ | 配信者のフォルダ移動 |

### バックエンド

| 技術 | 用途 | 選定理由 |
|------|------|----------|
| **Next.js API Routes** | APIエンドポイント | フロントエンドと統合、サーバーレス対応 |
| **Prisma** | ORM | 型安全なDB操作、マイグレーション |
| **Supabase (PostgreSQL)** | データベース | マネージドDB、リアルタイム機能 |
| **NextAuth.js** | 認証 | OAuth対応、セッション管理 |

### 外部API

| API | 用途 |
|-----|------|
| **Twitch Helix API** | 配信者検索、クリップ取得、ライブステータス |

---

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────┐
│                         クライアント                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Dashboard   │  │  Favorites  │  │  Settings   │             │
│  │  Content    │  │   Content   │  │   Content   │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│         ▼                ▼                ▼                     │
│  ┌─────────────────────────────────────────────────┐           │
│  │              React Query (状態管理)              │           │
│  │  - キャッシュ管理                                │           │
│  │  - 楽観的UI更新                                  │           │
│  │  - 自動再取得                                    │           │
│  └──────────────────────┬──────────────────────────┘           │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ /api/clips/  │  │ /api/        │  │ /api/twitch/ │          │
│  │  favorites   │  │  favorites   │  │  search      │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼─────────────────┼─────────────────┼───────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Twitch API    │  │    Prisma       │  │   Twitch API    │
│   (Helix)       │  │   (PostgreSQL)  │  │   (Helix)       │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## クリップ取得の仕組み

### 取得フロー詳細

```
ユーザーがダッシュボードにアクセス
          │
          ▼
┌─────────────────────────────────────┐
│ 1. React Query がキャッシュを確認   │
│    - staleTime: 5分                 │
│    - キャッシュがあれば即座に表示    │
└──────────────┬──────────────────────┘
               │ キャッシュなし or 古い
               ▼
┌─────────────────────────────────────┐
│ 2. API Route: /api/clips/favorites │
│    - 認証チェック (NextAuth)        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 3. DBからお気に入り配信者を取得     │
│    - Prisma: FavoriteStreamer       │
│    - ユーザーIDでフィルタ           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 4. 各配信者のクリップを並列取得     │
│    - Promise.all() で並列実行       │
│    - 各配信者5件 × N人              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 5. Twitch Helix API: /clips        │
│    - broadcaster_id: 配信者ID       │
│    - started_at: 48時間前           │
│    - ended_at: 現在                 │
│    - first: 5 (各配信者5件)         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 6. 全クリップを再生数順にソート     │
│    - view_count で降順ソート        │
│    - 全配信者のクリップを統合       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 7. クライアントに返却              │
│    - Cache-Control: 5分間           │
│    - React Query がキャッシュ       │
└─────────────────────────────────────┘
```

### なぜ直近48時間なのか？

```
問題: 7日間だと...
┌─────────────────────────────────────┐
│ 1週間前の大バズりクリップ (10万再生) │ ← 常に上位を独占
│ 1週間前のクリップ (5万再生)          │
│ 今日のクリップ (1000再生)           │ ← 埋もれる
└─────────────────────────────────────┘

解決: 48時間にすることで...
┌─────────────────────────────────────┐
│ 昨日のバズりクリップ (5000再生)     │ ← 新鮮なコンテンツが
│ 今日のクリップ (3000再生)           │   上位に表示される
│ 今日のクリップ (1000再生)           │
└─────────────────────────────────────┘
```

### 各配信者5件の理由

- **多すぎると**: 特定配信者のクリップで埋まる
- **少なすぎると**: 良いクリップを見逃す
- **5件**: バランスの取れた量、再生数上位のみ取得

### リアルタイム再生数順の仕組み

**重要: 毎回APIを呼び出すたびに、その時点での再生数上位5件を取得する**

```
【初回取得時】配信者Xのクリップ（48時間以内）
1位: Aクリップ (5000再生) ← 取得される
2位: Cクリップ (3000再生) ← 取得される
3位: Dクリップ (2000再生) ← 取得される
4位: Eクリップ (1500再生) ← 取得される
5位: Fクリップ (1000再生) ← 取得される
6位: Bクリップ (800再生)  ← 取得されない（6位以下）

【5分後に更新】Bクリップがバズった場合
1位: Bクリップ (10000再生) ← 取得される（新たにランクイン）
2位: Aクリップ (5500再生)  ← 取得される
3位: Cクリップ (3200再生)  ← 取得される
4位: Dクリップ (2100再生)  ← 取得される
5位: Eクリップ (1600再生)  ← 取得される
6位: Fクリップ (1100再生)  ← 取得されなくなる（6位に落ちた）
```

**Twitch APIの仕様:**
- `/clips` エンドポイントはデフォルトで**再生数順（view_count降順）**で返す
- `started_at` / `ended_at` パラメータで期間を指定
- `first` パラメータで取得件数を制限

**つまり:**
- キャッシュが切れて再取得するたびに、**最新の再生数ランキング**を取得
- 伸びているクリップは自動的に上位に浮上
- 伸び悩んだクリップは自動的にランク外に

---

## データフロー

### クリップ表示のデータフロー

```typescript
// 1. カスタムフック: useDashboardClips
const {
  allClips,        // 全クリップ（API取得）
  filteredClips,   // フィルター適用後
  likedClipIds,    // いいね済みID（Set）
  handleLikeToggle // いいね切り替え
} = useDashboardClips();

// 2. React Query でデータ取得
useQuery({
  queryKey: ['clips', 'favorites'],
  queryFn: () => fetch('/api/clips/favorites'),
  staleTime: 5 * 60 * 1000, // 5分間キャッシュ
});

// 3. クライアント側でソート・フィルター
// - 検索クエリでフィルター
// - ソートタイプで並び替え（再生数/日付）
// - フォルダでフィルター
```

### いいね機能のデータフロー

```
ユーザーがいいねボタンをクリック
          │
          ▼
┌─────────────────────────────────────┐
│ 1. 即座にUI更新（楽観的UI）         │
│    - React Query のキャッシュを更新 │
│    - ハートアニメーション表示       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 2. Debounce (500ms)                │
│    - 連打対応                       │
│    - 最終状態のみサーバーに送信     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 3. Server Action 実行              │
│    - addLikedClip / removeLikedClip│
│    - Prisma でDB更新               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 4. 完了時にキャッシュを再検証      │
│    - invalidateQueries             │
│    - サーバーと同期                 │
└─────────────────────────────────────┘
```

---

## 楽観的UI更新

### 実装パターン

```typescript
// hooks/use-dashboard-clips.ts

const handleLikeToggle = useCallback((clipId: string, isCurrentlyLiked: boolean) => {
  // 1. 即座にUIを更新（楽観的UI）
  queryClient.setQueryData(['clips', 'liked'], (old) => {
    if (newLikedState) {
      // いいね追加: キャッシュに追加
      return [...old, newClip];
    } else {
      // いいね削除: キャッシュから削除
      return old.filter(clip => clip.clipId !== clipId);
    }
  });

  // 2. 最終状態を記録（連打対応）
  pendingActionsRef.current.set(clipId, newLikedState);

  // 3. Debounce後にサーバーに送信
  debounceTimerRef.current = setTimeout(() => {
    // バッチ処理で一括送信
    actions.forEach(([id, shouldLike]) => {
      if (shouldLike) {
        addLikeMutation.mutate(clip);
      } else {
        removeLikeMutation.mutate(id);
      }
    });
  }, 500); // 500ms Debounce
}, []);
```

### なぜ楽観的UIなのか？

| 従来のアプローチ | 楽観的UI |
|-----------------|----------|
| クリック → API待機 → UI更新 | クリック → **即座にUI更新** → API送信 |
| ユーザーは待つ必要がある | 即座にフィードバック |
| ネットワーク遅延が体感される | 遅延を感じない |

### エラー時のロールバック

```typescript
onError: (error, variables, context) => {
  // エラー時は元の状態に戻す
  if (context?.previousData) {
    queryClient.setQueryData(['clips', 'liked'], context.previousData);
  }
}
```

---

## キャッシュ戦略

### なぜキャッシュが必要か？

```
【キャッシュなしの場合】
ユーザーA → Twitch API呼び出し → 配信者10人 × 5件 = 10回のAPI呼び出し
ユーザーB → Twitch API呼び出し → 配信者10人 × 5件 = 10回のAPI呼び出し
ユーザーC → Twitch API呼び出し → 配信者10人 × 5件 = 10回のAPI呼び出し
                    ↓
         Twitch API Rate Limit に到達するリスク
         レスポンス遅延（毎回API待ち）
```

**3層キャッシュ戦略で解決:**

```
┌─────────────────────────────────────────────────────────────┐
│                    3層キャッシュ構造                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Layer 1: React Query（クライアント側）                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ - staleTime: 5分間は「新鮮」とみなす                │   │
│  │ - 5分以内の再アクセス → キャッシュから即座に表示    │   │
│  │ - 5分経過後 → バックグラウンドで再取得              │   │
│  │ - gcTime: 10分間はメモリに保持                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↓                                  │
│  Layer 2: HTTP Cache（ブラウザ側）                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ - Cache-Control: private, max-age=300              │   │
│  │ - ブラウザがレスポンスを5分間キャッシュ             │   │
│  │ - private: ユーザー固有データなので共有キャッシュNG │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↓                                  │
│  Layer 3: Twitch Token（サーバー側）                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ - アクセストークンをメモリにキャッシュ              │   │
│  │ - 有効期限内は再利用（認証APIコール削減）           │   │
│  │ - 期限切れ時のみ新規取得                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Layer 1: React Query キャッシュ（採用理由）

**なぜReduxではなくReact Queryか？**

| 観点 | Redux | React Query |
|------|-------|-------------|
| 用途 | クライアント状態管理 | **サーバー状態管理** |
| キャッシュ | 自前実装が必要 | **組み込み** |
| 再取得 | 自前実装が必要 | **自動（staleTime経過後）** |
| 楽観的UI | 自前実装が必要 | **onMutate/onErrorで簡単** |
| コード量 | 多い（Action, Reducer, Thunk） | **少ない（useQuery/useMutation）** |

```typescript
// React Query の設定
useQuery({
  queryKey: ['clips', 'favorites'],  // キャッシュキー
  queryFn: () => fetch('/api/clips/favorites'),
  staleTime: 5 * 60 * 1000,  // 5分間は再取得しない
  gcTime: 10 * 60 * 1000,    // 10分間はメモリに保持
});
```

**staleTimeの意味:**
- `staleTime`（5分）: データが「古い」と判定されるまでの時間
- 5分以内に同じページを開く → **APIコールなし**、即座に表示
- 5分経過後 → バックグラウンドで再取得、最新データに更新

**gcTime（旧cacheTime）の意味:**
- コンポーネントがアンマウントされてもキャッシュを保持する時間
- 10分以内に戻る → キャッシュから即座に表示可能

### Layer 2: HTTP Cache

```typescript
// API Route のレスポンス
return NextResponse.json(
  { data: allClips },
  {
    headers: {
      'Cache-Control': 'private, max-age=300'
    }
  }
);
```

**なぜ`private`か？**
- クリップデータは**ユーザーごとに異なる**（お気に入り配信者が違う）
- `public`だとCDNや共有キャッシュに保存されてしまう
- `private`でブラウザのみにキャッシュを許可

### Layer 3: Twitch APIトークンキャッシュ

```typescript
// lib/twitch-api.ts

let accessToken: string | null = null;  // メモリにキャッシュ
let tokenExpiry: number = 0;

async function getTwitchAccessToken() {
  // トークンが有効期限内であれば再利用
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;  // キャッシュヒット
  }

  // 新規取得（Client Credentials Flow）
  const response = await fetch(TWITCH_AUTH_URL, { method: 'POST' });
  const data = await response.json();

  accessToken = data.access_token;
  tokenExpiry = Date.now() + data.expires_in * 1000;

  return accessToken;
}
```

**なぜトークンをキャッシュするか？**
- Twitch APIの認証は**毎回トークンが必要**
- トークン取得自体もAPI呼び出し（Rate Limitの対象）
- 有効期限内（約60日）は再利用することでAPIコール削減

### キャッシュの更新タイミング

```
【ユーザーの操作フロー】

1. ダッシュボードにアクセス
   └→ React Query: キャッシュなし → API呼び出し → データ表示

2. 他のページに移動（例: 設定ページ）
   └→ React Query: gcTime内なのでキャッシュ保持

3. 3分後にダッシュボードに戻る
   └→ React Query: staleTime内（5分）→ キャッシュから即座に表示
   └→ APIコールなし

4. 7分後にダッシュボードに戻る
   └→ React Query: staleTime超過 → キャッシュを表示しつつ
   └→ バックグラウンドで再取得 → 新データで更新
   └→ このとき最新の再生数ランキングを取得

5. ブラウザをリロード
   └→ React Query: キャッシュクリア
   └→ HTTP Cache: 5分以内なら304 Not Modified
   └→ APIから最新データを取得
```

### データの鮮度とパフォーマンスのトレードオフ

| キャッシュ時間 | メリット | デメリット |
|--------------|----------|------------|
| 短い（1分） | データが常に新鮮 | APIコール増加、遅延 |
| **5分（採用）** | **バランスが良い** | - |
| 長い（30分） | 高速、API負荷低 | データが古くなる |

**5分を選んだ理由:**
- クリップの再生数は**数分単位で大きく変わらない**
- ユーザーは通常**5分以上滞在**することが多い
- Twitch API Rate Limit（800リクエスト/分）を考慮

---

## データベース設計

### ER図

```
┌─────────────────┐     ┌─────────────────────┐
│      User       │     │   FavoriteStreamer  │
├─────────────────┤     ├─────────────────────┤
│ id (PK)         │────<│ userId (FK)         │
│ email           │     │ streamerId          │
│ password        │     │ streamerName        │
│ name            │     │ streamerLogin       │
│ image           │     │ streamerImage       │
└────────┬────────┘     └─────────────────────┘
         │
         │              ┌─────────────────────┐
         │              │     LikedClip       │
         │              ├─────────────────────┤
         ├─────────────<│ userId (FK)         │
         │              │ clipId              │
         │              │ clipUrl             │
         │              │ clipTitle           │
         │              │ broadcasterId       │
         │              │ broadcasterName     │
         │              │ viewCount           │
         │              │ duration            │
         │              └─────────────────────┘
         │
         │              ┌─────────────────────┐
         │              │      Folder         │
         │              ├─────────────────────┤
         └─────────────<│ userId (FK)         │
                        │ name                │
                        │ color               │
                        │ order               │
                        └──────────┬──────────┘
                                   │
                                   │
                        ┌──────────▼──────────┐
                        │   FolderStreamer    │
                        ├─────────────────────┤
                        │ folderId (FK)       │
                        │ streamerId          │
                        │ streamerName        │
                        └─────────────────────┘
```

### インデックス設計

```prisma
model FavoriteStreamer {
  @@unique([userId, streamerId])  // 重複防止
  @@index([userId])               // ユーザーごとの検索を高速化
}

model LikedClip {
  @@unique([userId, clipId])      // 重複防止
  @@index([userId])               // ユーザーごとの検索
  @@index([likedAt])              // 日付順ソート
}
```

---

## 認証フロー

### NextAuth.js 認証

```
┌─────────────────────────────────────────────────────────────┐
│                    認証フロー                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 未認証ユーザー                                          │
│     │                                                       │
│     ▼                                                       │
│  ┌─────────────────────────────────────┐                   │
│  │ オンボーディングモーダル表示        │                   │
│  │ - メール/パスワード認証            │                   │
│  │ - Google OAuth                     │                   │
│  └──────────────┬──────────────────────┘                   │
│                 │                                           │
│                 ▼                                           │
│  2. 認証処理                                                │
│     │                                                       │
│     ├─── Credentials Provider ───┐                         │
│     │    (メール/パスワード)     │                         │
│     │                            ▼                         │
│     │              ┌─────────────────────────┐             │
│     │              │ bcrypt でパスワード検証 │             │
│     │              └─────────────────────────┘             │
│     │                                                       │
│     └─── Google Provider ────────┐                         │
│          (OAuth 2.0)             │                         │
│                                  ▼                         │
│                    ┌─────────────────────────┐             │
│                    │ Google認証 → アカウント │             │
│                    │ 自動作成/連携           │             │
│                    └─────────────────────────┘             │
│                                                             │
│  3. セッション作成                                          │
│     - JWT トークン生成                                      │
│     - Cookie に保存                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Server Component での認証

```typescript
// app/(authenticated)/page.tsx

export default async function DashboardPage() {
  // サーバー側で認証チェック
  const session = await auth();

  if (!session?.user) {
    // 未認証: オンボーディング表示
    return <DashboardContent isAuthenticated={false} />;
  }

  // 認証済み: ユーザーデータを渡す
  return <DashboardContent userId={session.user.id} isAuthenticated={true} />;
}
```

---

## パフォーマンス最適化

### 1. 並列データ取得

```typescript
// 各配信者のクリップを並列取得
const clipPromises = favorites.map(async (favorite) => {
  return await getClipsByBroadcaster(favorite.streamerId, options);
});

const allClipsArrays = await Promise.all(clipPromises);
```

### 2. 無限スクロール

```typescript
// hooks/use-infinite-scroll.ts

// Intersection Observer で画面下部を監視
const observer = new IntersectionObserver(handleObserver, {
  rootMargin: '100px',  // 100px手前で発火
  threshold: 0,
});

// 発火時に次のページを読み込み
if (entry.isIntersecting && hasMore) {
  onLoadMore();
}
```

### 3. スケルトンローディング

```typescript
// 読み込み中はスケルトンを表示
if (isLoading) {
  return (
    <div className="grid-clips">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="aspect-video bg-gray-800 animate-pulse" />
      ))}
    </div>
  );
}
```

### 4. 画像遅延読み込み

- サムネイル画像は表示領域に入ってから読み込み
- デフォルトアバターでフォールバック

---

## ディレクトリ構造

```
my-app/
├── app/                          # Next.js App Router
│   ├── (authenticated)/          # 認証済みユーザー用ページ
│   │   ├── page.tsx             # ダッシュボード（/）
│   │   ├── favorites/           # お気に入り配信者管理
│   │   ├── favorites-clips/     # いいねしたクリップ
│   │   └── settings/            # 設定
│   ├── api/                     # API Routes
│   │   ├── clips/favorites/     # クリップ取得API
│   │   ├── favorites/           # お気に入り管理API
│   │   └── twitch/              # Twitch API連携
│   └── login/                   # ログインページ
│
├── components/                   # UIコンポーネント
│   ├── clips/                   # クリップ関連
│   │   ├── clip-card.tsx        # クリップカード
│   │   ├── clip-detail-modal.tsx # 詳細モーダル
│   │   └── clip-grid.tsx        # グリッド表示
│   ├── dashboard/               # ダッシュボード
│   ├── folders/                 # フォルダ管理
│   ├── onboarding/              # オンボーディング
│   └── ui/                      # shadcn/ui
│
├── hooks/                       # カスタムフック
│   ├── use-dashboard-clips.ts   # クリップ管理（楽観的UI）
│   ├── use-infinite-scroll.ts   # 無限スクロール
│   ├── use-modal.ts             # モーダル制御
│   └── use-toast.ts             # トースト通知
│
├── actions/                     # Server Actions
│   ├── liked-clips.ts           # いいね操作
│   └── folders.ts               # フォルダ操作
│
├── lib/                         # ユーティリティ
│   ├── auth.ts                  # NextAuth設定
│   ├── prisma.ts                # Prismaクライアント
│   ├── twitch-api.ts            # Twitch API
│   ├── constants.ts             # 定数定義
│   └── utils.ts                 # ユーティリティ関数
│
├── types/                       # 型定義
│   ├── twitch.ts                # Twitch API型
│   └── database.ts              # DB型
│
└── prisma/
    └── schema.prisma            # DBスキーマ
```

---

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` を `.env.local` にコピーして設定

```bash
# Database (Supabase)
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="openssl rand -base64 32 で生成"
NEXTAUTH_URL="http://localhost:3000"

# Twitch API
TWITCH_CLIENT_ID="..."
TWITCH_CLIENT_SECRET="..."

# Google OAuth (optional)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

### 3. データベースのマイグレーション

```bash
npx prisma generate
npx prisma db push
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

---

## 

### Q: なぜNext.js App Routerを選んだ？

**A:** Server Componentsによる初回ロード最適化、API Routesの統合、React Query との相性の良さ。認証チェックをサーバー側で行えるため、セキュリティも向上。

### Q: 楽観的UIを採用した理由は？

**A:** いいねボタンはユーザーが頻繁に操作する機能。毎回サーバー応答を待つと体感速度が悪化する。YouTubeやTwitterと同様のUXを実現するため採用。

### Q: なぜ直近48時間に絞っている？

**A:** 7日間だと過去のバズりクリップが常に上位を独占し、新しいコンテンツが埋もれる。48時間にすることで常に新鮮なクリップが表示される。

### Q: React Queryを選んだ理由は？

**A:** サーバー状態管理に特化しており、キャッシュ管理、楽観的UI更新、自動再取得が組み込みで提供される。Reduxと比較して、サーバー状態の管理がシンプルになる。

### Q: Debounceを500msにした理由は？

**A:** 短すぎると連打時に複数リクエストが発生、長すぎるとユーザーがページ遷移してしまう可能性がある。500msはバランスの取れた値。

---

## ライセンス

MIT
