---
name: type-definer
description: TypeScript型定義を作成する。新しいデータ構造やAPIレスポンスの型が必要な時に使用。
---

# Type Definer

TypeScript型定義を作成するスキル。

## 配置場所

```
types/
├── index.ts      # バレルエクスポート
├── twitch.ts     # Twitch API
├── database.ts   # Prisma対応
├── api.ts        # APIレスポンス
└── auth.ts       # 認証
```

## 基本構造

```typescript
// types/[feature].ts
export interface FeatureItem {
  id: string;
  name: string;
  createdAt: Date | string;
}

export interface FeatureResponse {
  data: FeatureItem[];
  total: number;
}
```

## バレルエクスポート

```typescript
// types/index.ts
export * from './twitch';
export * from './database';
export * from './api';
export * from './auth';
```

## 使用例

```typescript
import type { FeatureItem } from '@/types';
```

## チェックリスト

- [ ] interfaceを優先使用
- [ ] types/index.tsにエクスポート追加
- [ ] オプショナルに?を付与
