---
paths: actions/**/*.ts
---

# サーバーアクションルール

## 必須

- **MUST**: `'use server'`ディレクティブを記述
- **MUST**: `await auth()`で認証チェック（未認証時は早期リターン）
- **MUST**: バリデーションを実装（Zodスキーマ推奨）
- **MUST**: `ActionResult`型（`{ success, message, error? }`）で返却
- **MUST**: try-catchでエラーハンドリング
- **SHOULD**: 変更後に`revalidatePath`でキャッシュ再検証

## Zodバリデーション（推奨）

クライアント/サーバー共通のスキーマを`lib/validations/`に定義し、`z.infer`で型を導出する。

```typescript
// lib/validations/folder.ts
import { z } from 'zod';

export const createFolderSchema = z.object({
  name: z.string().min(1, '名前は必須です').max(50, '50文字以内'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, '無効なカラーコード'),
});

export type CreateFolderInput = z.infer<typeof createFolderSchema>;
```

```typescript
// actions/folders.ts
'use server';

import { createFolderSchema } from '@/lib/validations/folder';

export async function createFolder(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: '認証が必要です' };
  }

  const parsed = createFolderSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0].message };
  }

  try {
    await prisma.folder.create({ data: { ...parsed.data, userId: session.user.id } });
    revalidatePath(ROUTES.HOME);
    return { success: true, message: 'フォルダを作成しました' };
  } catch (error) {
    return { success: false, message: 'フォルダの作成に失敗しました' };
  }
}
```

## useActionState連携（フォーム）

Server Actionを`useActionState`でラップすることで、pending状態とエラーをフォームに反映できる。

```typescript
// コンポーネント側
'use client';

import { useActionState } from 'react';

const [state, formAction, isPending] = useActionState(createFolder, {
  success: false,
  message: '',
});

return (
  <form action={formAction}>
    <input name="name" />
    {!state.success && state.message && <p className="text-error">{state.message}</p>}
    <button disabled={isPending}>作成</button>
  </form>
);
```
