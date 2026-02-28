# 実装パターン・過去の問題と解決策

実装時に参考にすべきパターンと過去の問題解決策を記録。

---

## 楽観的UI

### パターン1: TanStack Query v5 — `variables`で即時反映（推奨）

シンプルなケースでは`useMutation`の`variables`を直接参照してUIに反映。rollback不要。

```typescript
const deleteMutation = useMutation({
  mutationFn: async (id: string) => await deleteItem(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['items'] });
    toast.success('削除しました');
  },
});

// UI側: 削除中のアイテムをフィルタ
const visibleItems = items.filter(
  (item) => !deleteMutation.isPending || deleteMutation.variables !== item.id
);
```

### パターン2: TanStack Query v5 — `onMutate`キャッシュ操作

複数箇所でキャッシュを参照する場合や、複雑な更新が必要な場合。

```typescript
const deleteMutation = useMutation({
  mutationFn: async (id: string) => await deleteItem(id),
  onMutate: async (id) => {
    await queryClient.cancelQueries({ queryKey: ['items'] });
    const previousData = queryClient.getQueryData<Item[]>(['items']);

    queryClient.setQueryData<Item[]>(['items'], (old) =>
      old?.filter((item) => item.id !== id)
    );

    return { previousData };
  },
  onSuccess: () => {
    toast.success('削除しました');
  },
  onError: (_error, _id, context) => {
    if (context?.previousData) {
      queryClient.setQueryData(['items'], context.previousData);
    }
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['items'] });
  },
});
```

### パターン3: React 19 `useOptimistic`（Server Action連携時）

Server Actionと直接連携する場合に最適。

```typescript
const [optimisticItems, addOptimistic] = useOptimistic(
  items,
  (state, deletedId: string) => state.filter((item) => item.id !== deletedId)
);

async function handleDelete(id: string) {
  addOptimistic(id);
  await deleteItemAction(id);
}
```

---

## モーダル関連

### 問題1: 前のデータが一瞬表示される

**症状:** モーダルA → モーダルBを開くと、一瞬モーダルAの内容が表示される

**原因:** propsが変わってもローカルステートがすぐに更新されない

**解決策:**
```typescript
// ❌ 悪い例
useEffect(() => {
  if (folder?.folderStreamers) {
    setLocalStreamers(folder.folderStreamers);
  }
}, [folder]);

// ✅ 良い例: IDの変更を検知して即座にリセット
const prevIdRef = useRef<string | null>(null);

useEffect(() => {
  const currentId = folder?.id || null;
  if (currentId !== prevIdRef.current) {
    setLocalData(folder?.data || []);
    prevIdRef.current = currentId;
  } else if (folder?.data) {
    setLocalData(folder.data);
  }
}, [folder]);
```

### 問題2: backdrop-blurによるFPS低下

**原因:** `backdrop-blur-sm`はGPU負荷が高く、iframe動画再生で悪化

```typescript
// ❌ <div className="bg-black/80 backdrop-blur-sm">
// ✅ <div className="bg-black/90">
```

---

## モバイル対応関連

### 問題3: ドラッグ&ドロップとスワイプの競合

```typescript
const touchSensor = useSensor(TouchSensor, {
  activationConstraint: { delay: 250, tolerance: 5 },
});
const mouseSensor = useSensor(MouseSensor, {
  activationConstraint: { distance: 10 },
});
const sensors = useSensors(mouseSensor, touchSensor);
```

### 問題4: モバイルフッターにボタンが隠れる

```typescript
<div className="flex gap-3 pb-20 lg:pb-0">
  <Button>次へ</Button>
</div>
```

---

## Tailwind CSS v4

### `@utility`ディレクティブ（推奨）

カスタムユーティリティは`@utility`で定義。自動的にモディファイア（hover:, md:等）対応。

```css
/* ✅ Tailwind v4 推奨 */
@utility modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background-color: rgb(0 0 0 / 0.9);
}

/* ❌ レガシー: @layer utilities + @apply */
@layer utilities {
  .modal-overlay {
    @apply fixed inset-0 z-50 bg-black/90;
  }
}
```
