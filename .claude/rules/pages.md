---
paths: app/**/page.tsx
---

# ページルール

- **NEVER**: `app/*/page.tsx`に`'use client'`を書かない
- **MUST**: サーバー側で`await auth()`による認証チェック
- **MUST**: 未認証時は`redirect(ROUTES.LOGIN)`
- **MUST**: UIはクライアントコンポーネント`[feature]-content.tsx`に委譲
- **MUST**: 定数は`lib/constants.ts`から取得
