# 実装パターン・過去の問題と解決策

実装時に参考にすべき過去の問題と解決策を記録。

---

## モーダル関連

### 問題1: 前のデータが一瞬表示される

**症状:**
- モーダルA → モーダルBを開くと、一瞬モーダルAの内容が表示される
- 例: フォルダA → フォルダBを開くと、フォルダAの配信者が一瞬見える

**原因:**
- propsが変わってもローカルステートがすぐに更新されない
- useEffectの発火タイミングが遅い

**解決策:**
```typescript
// ❌ 悪い例: propsの変更だけを監視
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
    // IDが変わったので即座にリセット
    setLocalData(folder?.data || []);
    prevIdRef.current = currentId;
  } else if (folder?.data) {
    // 同じIDのデータ更新
    setLocalData(folder.data);
  }
}, [folder]);
```

**適用ファイル例:**
- `components/folders/folder-streamers-modal.tsx`

---

### 問題2: backdrop-blurによるFPS低下

**症状:**
- モーダル内で動画再生時にFPSが低下
- 本番環境で特に顕著

**原因:**
- `backdrop-blur-sm`はGPU負荷が高い
- iframe動画再生との組み合わせで悪化

**解決策:**
```typescript
// ❌ 悪い例
<div className="bg-black/80 backdrop-blur-sm">

// ✅ 良い例
<div className="bg-black/90">
```

---

## 楽観的UI関連

### 問題3: 削除後にアイテムが残って見える

**症状:**
- 削除ボタン押下 → トースト表示 → まだリストにアイテムが残っている
- 数秒後にやっと消える

**原因:**
- `invalidateQueries`でサーバーからデータ再取得を待っている
- ネットワーク遅延で表示が遅れる

**解決策:**
```typescript
// ❌ 悪い例: サーバー応答を待つ
const deleteMutation = useMutation({
  mutationFn: async (id) => await deleteItem(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['items'] });
    showToast('削除しました');
  },
});

// ✅ 良い例: 楽観的UIで即座に削除
const deleteMutation = useMutation({
  mutationFn: async (id) => await deleteItem(id),
  onMutate: async (id) => {
    // キャンセルしてキャッシュを保存
    await queryClient.cancelQueries({ queryKey: ['items'] });
    const previousData = queryClient.getQueryData(['items']);

    // 即座にUIから削除
    queryClient.setQueryData(['items'], (old) =>
      old?.filter((item) => item.id !== id)
    );

    return { previousData };
  },
  onSuccess: () => {
    showToast('削除しました');
  },
  onError: (error, id, context) => {
    // エラー時はロールバック
    if (context?.previousData) {
      queryClient.setQueryData(['items'], context.previousData);
    }
  },
});
```

---

## モバイル対応関連

### 問題4: ドラッグ&ドロップとスワイプの競合

**症状:**
- モバイルでスクロールしようとするとドラッグが発動
- 意図しない挙動が起きる

**解決策:**
```typescript
import { TouchSensor, MouseSensor, useSensor, useSensors } from '@dnd-kit/core';

// タッチは長押しで発動（スワイプと区別）
const touchSensor = useSensor(TouchSensor, {
  activationConstraint: {
    delay: 250,      // 250ms長押し
    tolerance: 5,    // 5px以内の移動は許容
  },
});

const mouseSensor = useSensor(MouseSensor, {
  activationConstraint: {
    distance: 10,    // 10px移動で発動
  },
});

const sensors = useSensors(mouseSensor, touchSensor);

// DndContextに渡す
<DndContext sensors={sensors} onDragEnd={handleDragEnd}>
```

---

### 問題5: モバイルフッターにボタンが隠れる

**症状:**
- モーダル内の「次へ」ボタンがフッターナビに隠れて押せない

**解決策:**
```typescript
// フッターボタンにモバイル用パディングを追加
<div className="flex gap-3 pb-20 lg:pb-0">
  <Button>次へ</Button>
</div>
```
