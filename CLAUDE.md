# Twitch Clip Viewer

## Why（目的）

Twitch配信者のクリップを人気順で表示するWebアプリケーション。
ユーザーがお気に入りの配信者を登録し、そのクリップを効率的に閲覧できる。

## What（構造）

### 技術スタック
- Next.js 14 (App Router) / TypeScript / Tailwind CSS / shadcn/ui
- Prisma / Supabase (PostgreSQL) / NextAuth.js
- Twitch Helix API

### ディレクトリ構造
```
app/              # ページ（サーバーコンポーネント）
components/       # UIコンポーネント（クライアント）
actions/          # サーバーアクション
hooks/            # カスタムフック
lib/              # ユーティリティ、constants.ts
types/            # 型定義
.claude/rules/    # パス別ルール
.claude/skills/   # スキル定義
```

## How（作業方法）

### コマンド
```bash
npm run dev          # 開発サーバー
npm run build        # ビルド
npx prisma generate  # Prisma生成
npx prisma db push   # DBスキーマ反映
```

---

## 実装フロー（必須・段階的に実行）

### STEP 1: 理解確認
```
【理解確認】
□ タスクの内容を正確に理解したか？
□ 不明点はないか？（あれば質問）
□ 影響範囲を把握したか？
```
→ **不明点があれば必ず質問してから次へ**

### STEP 2: 実装宣言（実装前に必ず表示）
```
【実装宣言】
■ タスク: [具体的なタスク名]
■ 適用スキル: [component-creator / page-creator / etc]
■ 適用ルール: [code-style / workflow / etc]
■ 変更ファイル: [変更予定のファイル一覧]
■ 実装方針: [どのように実装するか]
```
→ **ユーザーに確認を求める：「この方針で進めてよいですか？」**

### STEP 3: 実装（都度チェック）
各ファイル変更後に確認：
```
【実装進捗】
✅ [完了したファイル/タスク]
🔄 [現在作業中]
⏳ [未着手]

【チェック】
□ 命名規則に従っているか
□ Props型を定義したか
□ 定数はconstants.tsから取得しているか
□ 50行超えは分割したか
```

### STEP 4: リファクタリング確認
```
【リファクタリング確認】
□ 不要なコードを削除したか
□ 重複コードはないか
□ 型定義は適切か
□ コンソールログは削除したか
```

### STEP 5: ビルド確認
```bash
npm run build
```
→ **エラーがあれば修正**

### STEP 6: コミット確認（最重要）
```
【コミット確認】
変更ファイル:
- [ファイル1]
- [ファイル2]

コミットメッセージ案:
[メッセージ]
```
→ **必ず「コミット・プッシュしてよいですか？」と確認**
→ **ユーザーの承認後にのみ実行**

---

## Non-negotiables（厳守事項）

### セキュリティ
- 機密情報をコードに含めない
- 環境変数は`.env.local`で管理

### Server/Client分離
- `app/*/page.tsx`は必ずサーバーコンポーネント
- 認証は`await auth()`でサーバー側実行

### Git操作
- mainへの直接プッシュ禁止
- コミット・プッシュは必ずユーザー確認後

---

詳細ルールは `.claude/rules/` を参照
スキル定義は `.claude/skills/` を参照
