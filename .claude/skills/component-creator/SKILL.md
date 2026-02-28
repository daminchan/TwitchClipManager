---
name: component-creator
description: Reactコンポーネントを作成する。UIパーツが必要な時に使用。Props型定義と50行分割ルールを適用。
---

# Component Creator

Reactコンポーネントを作成するスキル。

## 基本テンプレート

```typescript
'use client';

import { LABELS } from '@/lib/constants';

interface ComponentNameProps {
  userId: string;
  onAction?: () => void;
}

export function ComponentName({ userId, onAction }: ComponentNameProps) {
  return <div>{/* UI */}</div>;
}
```

## フォームテンプレート（RHF + Zod + Server Action）

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { schema, type SchemaType } from '@/lib/validations/feature';
import { submitAction } from '@/actions/feature';
import { LABELS } from '@/lib/constants';

interface FeatureFormProps {
  onSuccess: () => void;
}

export function FeatureForm({ onSuccess }: FeatureFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SchemaType>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: SchemaType) => {
    const result = await submitAction(data);
    if (result.success) onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <input {...register('name')} placeholder={LABELS.PLACEHOLDERS.NAME} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? LABELS.BUTTONS.SAVING : LABELS.BUTTONS.SAVE}
      </button>
    </form>
  );
}
```

## 分割パターン（50行超え時）

```
components/[feature]/
├── [feature]-content.tsx      # 親
├── [section]-section.tsx      # セクション
└── [sub-component].tsx        # サブ
```

## チェックリスト

- [ ] Props型を定義
- [ ] 50行超えは分割
- [ ] 定数はconstants.tsから取得
- [ ] 命名規則（kebab-case/PascalCase）
- [ ] useEffectの代わりにuseMemoを使えないか確認

既知のパターン・注意点は `@.claude/rules/patterns.md` を参照。
