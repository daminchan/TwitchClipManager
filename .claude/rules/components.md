---
paths: components/**/*.tsx
---

# コンポーネントルール

## 必須

- **MUST**: `'use client'`ディレクティブを記述
- **MUST**: Props型をinterfaceで定義（`ComponentNameProps`形式）
- **MUST**: 定数は`lib/constants.ts`から取得
- **MUST**: 50行超えは分割（`components/[feature]/`配下に配置）
- **MUST**: ファイル名はkebab-case、コンポーネント名はPascalCase
- **NEVER**: `backdrop-blur`を使用しない（FPS低下の原因）
- **SHOULD**: モーダルではID変更検知で即座にリセット（`patterns.md`参照）

## 楽観的UI — `useOptimistic`

Server Actionと連携する楽観的UIには`useOptimistic`を使用：

```typescript
const [optimisticItems, addOptimistic] = useOptimistic(
  items,
  (state, action: { type: 'delete'; id: string }) =>
    state.filter((item) => item.id !== action.id)
);

async function handleDelete(id: string) {
  addOptimistic({ type: 'delete', id });
  await deleteItemAction(id);
}
```

TanStack Query連携時は`variables`パターンを優先（`patterns.md`参照）。

## フォーム — React Hook Form + Zod + Server Action

バリデーション付きフォームの推奨構成：

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFolderSchema, type CreateFolderInput } from '@/lib/validations/folder';

export function CreateFolderForm({ onSuccess }: CreateFolderFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateFolderInput>({
    resolver: zodResolver(createFolderSchema),
  });

  const onSubmit = async (data: CreateFolderInput) => {
    const result = await createFolder(data);
    if (result.success) onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <p className="text-error">{errors.name.message}</p>}
      <button disabled={isSubmitting}>作成</button>
    </form>
  );
}
```
