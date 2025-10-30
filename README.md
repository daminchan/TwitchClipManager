# Twitch Clip Viewer

お気に入りの配信者のクリップを人気順で表示するWebアプリケーション

## 技術スタック

- **Next.js 16** - App Router
- **TypeScript** - 型安全性
- **Tailwind CSS** - スタイリング
- **shadcn/ui** - UIコンポーネント
- **Prisma** - ORM
- **Supabase** - データベース（PostgreSQL）
- **NextAuth.js** - 認証
- **Twitch Helix API** - クリップデータ取得

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` を `.env.local` にコピーして、必要な環境変数を設定してください。

```bash
cp .env.example .env.local
```

#### 必要な環境変数

##### DATABASE_URL（Supabase）

1. [Supabase](https://supabase.com/)でプロジェクトを作成
2. プロジェクト設定 → Database → Connection stringからURIを取得
3. `DATABASE_URL` に設定

##### NEXTAUTH_SECRET

以下のコマンドでシークレットキーを生成：

```bash
openssl rand -base64 32
```

生成されたキーを `NEXTAUTH_SECRET` に設定

##### Twitch API（TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET）

1. [Twitch Developers Console](https://dev.twitch.tv/console/apps)にアクセス
2. 「アプリケーションを登録」をクリック
3. 必要な情報を入力：
   - 名前: 任意のアプリ名
   - OAuth Redirect URLs: `http://localhost:3000`（開発用）
   - Category: Website Integration
4. 「作成」をクリック
5. Client IDとClient Secretを取得して設定

### 3. データベースのマイグレーション

Prismaでデータベーススキーマを作成：

```bash
npx prisma generate
npx prisma db push
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 使い方

1. **ログイン**: メールアドレスでログイン
2. **配信者を検索**: 検索バーでTwitch配信者を検索
3. **お気に入りに追加**: 検索結果から配信者を選択して自動的にお気に入りに追加
4. **クリップを表示**: お気に入り配信者を選択すると、人気クリップが表示されます
5. **クリップを視聴**: クリップカードをクリックしてTwitchで視聴

## プロジェクト構造

```
app/
├── .claude/skills/        # Claude Skills定義
├── app/                   # Next.js App Router
│   ├── api/              # API Routes
│   ├── login/            # ログインページ
│   ├── dashboard/        # ダッシュボード
│   ├── layout.tsx        # ルートレイアウト
│   └── page.tsx          # ランディングページ
├── components/           # Reactコンポーネント
│   ├── ui/              # shadcn/uiコンポーネント
│   ├── auth/            # 認証関連
│   ├── streamers/       # 配信者関連
│   ├── clips/           # クリップ関連
│   └── layout/          # レイアウトコンポーネント
├── lib/                 # ユーティリティ関数
│   ├── auth.ts          # NextAuth設定
│   ├── prisma.ts        # Prismaクライアント
│   ├── twitch-api.ts    # Twitch API統合
│   ├── utils.ts         # 汎用ユーティリティ
│   └── constants.ts     # 定数定義
├── prisma/              # Prisma設定
│   └── schema.prisma    # データベーススキーマ
├── types/               # TypeScript型定義
└── DEVELOPMENT_RULES.md # 開発ルール・ガイドライン
```

## 開発ルール

新機能の追加や修正を行う前に、必ず `DEVELOPMENT_RULES.md` を確認してください。

### Claude Skills

このプロジェクトでは、以下のClaude Skillsを使用して一貫性のある開発を行います：

- `component-creator` - Reactコンポーネント作成
- `api-creator` - API Route作成
- `type-definer` - TypeScript型定義作成
- `page-creator` - Next.jsページ作成

詳細は `DEVELOPMENT_RULES.md` のセクション12を参照してください。

## データベーススキーマ

### User
- ユーザー情報を管理
- NextAuth.jsと連携

### FavoriteStreamer
- お気に入り配信者を管理
- ユーザーごとに複数の配信者を保存可能

詳細は `prisma/schema.prisma` を参照してください。

## API エンドポイント

### 認証
- `POST /api/auth/callback/credentials` - ログイン

### お気に入り
- `GET /api/favorites` - お気に入り一覧取得
- `POST /api/favorites` - お気に入り追加
- `DELETE /api/favorites?streamerId={id}` - お気に入り削除

### Twitch
- `GET /api/twitch/streamers?query={name}` - 配信者検索
- `GET /api/twitch/clips?broadcasterId={id}&days={days}` - クリップ取得

## トラブルシューティング

### データベース接続エラー

```bash
# Prismaクライアントを再生成
npx prisma generate

# データベーススキーマを再同期
npx prisma db push
```

### Twitch API エラー

- Client IDとClient Secretが正しく設定されているか確認
- Twitchアプリが有効化されているか確認

### 認証エラー

- `NEXTAUTH_SECRET` が設定されているか確認
- `NEXTAUTH_URL` がアプリケーションのURLと一致しているか確認

## ライセンス

MIT
