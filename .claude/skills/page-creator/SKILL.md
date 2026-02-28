---
name: page-creator
description: Next.js App Routerのページを作成する。新しいページが必要な時に使用。Server/Client分離パターンを適用。
---

# Page Creator

Next.js App Routerのページを作成するスキル。

## 手順

### 1. サーバーコンポーネント作成

`app/[feature]/page.tsx`:
```typescript
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { FeatureContent } from '@/components/[feature]/[feature]-content';
import { ROUTES } from '@/lib/constants';

export default async function FeaturePage() {
  const session = await auth();
  if (!session?.user) {
    redirect(ROUTES.LOGIN);
  }
  return <FeatureContent userId={session.user.id!} />;
}
```

### 2. クライアントコンポーネント作成

`components/[feature]/[feature]-content.tsx`:
```typescript
'use client';

interface FeatureContentProps {
  userId: string;
}

export function FeatureContent({ userId }: FeatureContentProps) {
  return <div>{/* UI */}</div>;
}
```

## チェックリスト

- [ ] page.tsxに`'use client'`がない
- [ ] サーバー側で認証チェック
- [ ] クライアントコンポーネントは`[feature]-content.tsx`形式
- [ ] Props型定義あり
