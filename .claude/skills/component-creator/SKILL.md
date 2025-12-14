---
name: component-creator
description: Reactコンポーネントを作成する。UIパーツが必要な時に使用。Props型定義と50行分割ルールを適用。
---

# Component Creator

Reactコンポーネントを作成するスキル。

## 基本構造

```typescript
'use client';

import { useState } from 'react';
import { LABELS } from '@/lib/constants';

interface ComponentNameProps {
  userId: string;
  onAction?: () => void;
}

export function ComponentName({ userId, onAction }: ComponentNameProps) {
  const [state, setState] = useState(false);

  const handleClick = () => {
    // ロジック
  };

  return (
    <div>
      {/* UI */}
    </div>
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

---

## モーダルコンポーネントのパターン

### 前のデータが残る問題の対策

propsで渡されるデータが変わったときに、前のデータが一瞬表示される問題を防ぐ。

```typescript
interface ModalProps {
  isOpen: boolean;
  data: SomeData | null;
  onClose: () => void;
}

export function Modal({ isOpen, data, onClose }: ModalProps) {
  const [localData, setLocalData] = useState<SomeData[]>([]);
  const prevIdRef = useRef<string | null>(null);

  // ✅ IDの変更を検知して即座にリセット
  useEffect(() => {
    const currentId = data?.id || null;

    if (currentId !== prevIdRef.current) {
      // IDが変わったので即座にリセット
      setLocalData(data?.items || []);
      prevIdRef.current = currentId;
    } else if (data?.items) {
      // 同じIDのデータ更新
      setLocalData(data.items);
    }
  }, [data]);

  if (!isOpen || !data) return null;

  return (
    // モーダルUI
  );
}
```

### モーダル背景のパフォーマンス対策

```typescript
// ❌ backdrop-blurはFPS低下の原因
<div className="bg-black/80 backdrop-blur-sm">

// ✅ 代わりに不透明度を上げる
<div className="bg-black/90">
```

### モバイルフッターに隠れる対策

```typescript
// フッターボタンにモバイル用パディング
<div className="flex gap-3 pb-20 lg:pb-0">
  <Button>次へ</Button>
</div>
```

---

## 参考

詳細なパターンは `.claude/rules/patterns.md` を参照
