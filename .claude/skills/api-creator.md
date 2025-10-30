---
description: Create API routes following DEVELOPMENT_RULES.md standards
enabled: true
---

# API Creator Skill

このスキルは、DEVELOPMENT_RULESに準拠したAPI Routeを作成します。

## 適用ルール

### 1. API Routes配置（DEVELOPMENT_RULES セクション6.1）
- **ルール**: `app/api/` 配下に機能ごとに配置
- **理由**: RESTful設計で直感的なエンドポイント

### 2. エラーレスポンス（DEVELOPMENT_RULES セクション6.2）
- **ルール**: 一貫したエラー形式 `{ error, code, details }`
- **理由**: フロントエンドでの統一的なエラーハンドリング

### 3. 環境変数の検証（DEVELOPMENT_RULES セクション6.3）
- **ルール**: すべての機密情報は環境変数化し、存在確認
- **理由**: セキュリティとポータビリティの確保

### 4. 型定義（DEVELOPMENT_RULES セクション8）
- **ルール**: API仕様に基づいた厳密な型定義
- **理由**: 型安全性を最大化し、ランタイムエラーを防ぐ

### 5. エラーハンドリング（DEVELOPMENT_RULES セクション9）
- **ルール**: try-catchで包み、ユーザーフレンドリーなメッセージ
- **理由**: ユーザー体験を損なわず、デバッグ情報も保持

### 6. セキュリティ（DEVELOPMENT_RULES セクション11）
- **ルール**: 入力検証、認証チェック、クライアントに機密情報を公開しない
- **理由**: 不正な入力からアプリケーションを保護

## 実行手順

1. エンドポイント設計を確認
2. 適切なHTTPメソッド（GET/POST/PUT/DELETE）を選択
3. 認証が必要な場合はgetServerSessionでチェック
4. 入力バリデーションを実装
5. try-catchでエラーハンドリング
6. 一貫したレスポンス形式を返す

## 使用例

API Route作成時:
- `app/api/favorites/route.ts` - お気に入り管理
- NextAuth.jsのセッションチェック
- Prismaでデータベース操作
- 適切なHTTPステータスコードを返す
