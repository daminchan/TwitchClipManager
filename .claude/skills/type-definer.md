---
description: Define TypeScript types following DEVELOPMENT_RULES.md standards
enabled: true
---

# Type Definer Skill

このスキルは、DEVELOPMENT_RULESに準拠したTypeScript型定義を作成します。

## 適用ルール

### 1. 型定義の優先順位（DEVELOPMENT_RULES セクション4.7）
- **ルール**: `interface` を優先、必要に応じて `type` を使用
- **理由**: `interface` は拡張可能で、エラーメッセージが明確

### 2. 型定義の配置（DEVELOPMENT_RULES セクション3）
- **ルール**: 型定義は `types/` に集約
- **理由**: 型の一元管理で整合性を保つ

### 3. API型定義（DEVELOPMENT_RULES セクション8.1）
- **ルール**: API仕様に基づいた厳密な型定義
- **理由**: 型安全性を最大化し、ランタイムエラーを防ぐ

### 4. Props型定義（DEVELOPMENT_RULES セクション8.2）
- **ルール**: すべてのコンポーネントでProps型を定義
- **理由**: コンポーネントのインターフェースを明確化

## 実行手順

1. 型定義の目的を確認（API、Props、共通型など）
2. 適切なファイルに配置
   - `types/twitch.ts` - Twitch API関連
   - `types/auth.ts` - 認証関連
   - `types/index.ts` - 共通型
3. interfaceまたはtypeを適切に選択
4. すべてのフィールドに型を付ける
5. オプショナルフィールドには `?` を付ける
6. JSDocコメントで説明を追加

## 使用例

型定義作成時:
- Twitch APIレスポンスの型定義
- コンポーネントProps型
- API Responseの共通型
- カスタムフックの戻り値型
