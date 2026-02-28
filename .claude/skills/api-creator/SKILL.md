---
name: api-creator
description: API Routeを作成する。外部API連携やWebhook受信が必要な時に使用。DB操作はサーバーアクションを推奨。
---

# API Creator

API Routeを作成するスキル。

## 基本構造（Zodバリデーション付き）

```typescript
// app/api/[feature]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const querySchema = z.object({
  id: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ id: searchParams.get('id') });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  try {
    const data = await prisma.model.findMany({
      where: { userId: session.user.id },
    });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

## POSTリクエスト（ボディバリデーション）

```typescript
const createSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  try {
    const data = await prisma.model.create({
      data: { ...parsed.data, userId: session.user.id },
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

## 使い分け

| 用途 | 推奨 |
|-----|------|
| DB操作 | サーバーアクション |
| 外部API連携 | API Route |
| Webhook | API Route |

## チェックリスト

- [ ] 認証チェック実装
- [ ] Zodでバリデーション
- [ ] 適切なステータスコード
- [ ] エラーレスポンスの統一形式
