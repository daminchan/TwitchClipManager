---
description: Create React components following DEVELOPMENT_RULES.md standards
enabled: true
---

# Component Creator Skill

このスキルは、DEVELOPMENT_RULESに準拠したReactコンポーネントを作成します。

## 適用ルール

### 1. ファイル命名規則（DEVELOPMENT_RULES セクション4.1）
- **ルール**: kebab-case を使用
- **理由**: ファイルシステムでの可読性向上、大文字小文字の問題を回避

### 2. コンポーネント命名規則（DEVELOPMENT_RULES セクション4.2）
- **ルール**: PascalCase を使用
- **理由**: React/TypeScriptの標準的な命名規則

### 3. コンポーネント構造（DEVELOPMENT_RULES セクション4.6）
- **ルール**: 型定義 → コンポーネント定義 → フック → ハンドラー → JSX
- **理由**: 一貫した構造で可読性を向上

### 4. インポート順序（DEVELOPMENT_RULES セクション4.5）
- **ルール**: React/Next.js → 外部ライブラリ → 内部コンポーネント → ユーティリティ・型 → スタイル
- **理由**: 依存関係を明確化し、可読性を向上

### 5. Props型定義（DEVELOPMENT_RULES セクション8）
- **ルール**: すべてのコンポーネントでProps型を定義
- **理由**: コンポーネントのインターフェースを明確化

## 実行手順

1. コンポーネント名と配置場所を確認
2. 適切なディレクトリに配置（components/ui/、components/auth/、components/streamers/、components/clips/、components/layout/）
3. 上記のルールに従ってコンポーネントを作成
4. 必要に応じてshadcn/uiコンポーネントを使用
5. TypeScript型を厳密に定義

## 使用例

コンポーネント作成時:
- `components/clips/clip-card.tsx` を作成
- TwitchClip型を使用
- shadcn/ui の Card コンポーネントを活用
