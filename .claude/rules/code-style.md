# コーディング規約

## 命名規則

| 対象 | 規則 | 例 |
|-----|------|-----|
| ファイル | kebab-case | `clip-card.tsx` |
| コンポーネント | PascalCase | `ClipCard` |
| 関数 | camelCase | `fetchClips` |
| 定数 | UPPER_SNAKE_CASE | `API_ENDPOINTS` |

## インポート順序

1. React/Next.js
2. 外部ライブラリ
3. 内部コンポーネント
4. ユーティリティ・型

## 型定義

- interfaceを優先使用
- 型は`types/`に集約
- Props型は必ず定義

## 定数管理

すべてのテキスト・ルート・エンドポイントは`lib/constants.ts`で管理：
```typescript
import { ROUTES, LABELS, API_ENDPOINTS } from '@/lib/constants';
```

## 分割基準

- コンポーネントが50行を超えたら分割
- ビジネスロジックが複雑ならカスタムフック化

## useEffect削減

- **派生state**: `useState` + `useEffect`で計算しない → `useMemo`を使う
- **propsの同期**: useEffectでstateにコピーしない → propsを直接使うか、keyでリセット
- **副作用のみ**: DOM操作・外部API・タイマー等、本当に副作用が必要な場合のみuseEffect

```typescript
// ❌ 悪い例: 派生stateにuseEffect
const [filtered, setFiltered] = useState(items);
useEffect(() => {
  setFiltered(items.filter((i) => i.active));
}, [items]);

// ✅ 良い例: useMemoで派生
const filtered = useMemo(
  () => items.filter((i) => i.active),
  [items]
);
```

## 早期リターン

条件分岐はネストを避け、早期リターンで読みやすくする：

```typescript
// ❌ 悪い例
function process(data: Data | null) {
  if (data) {
    if (data.isValid) {
      return doSomething(data);
    }
  }
  return null;
}

// ✅ 良い例
function process(data: Data | null) {
  if (!data) return null;
  if (!data.isValid) return null;
  return doSomething(data);
}
```
