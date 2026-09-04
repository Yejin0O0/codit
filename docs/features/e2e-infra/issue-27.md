# Issue 27: [e2e-infra] 접힌 pill 드래그·클릭 구분 검증

## 시그니처

### 프론트엔드 (TypeScript, E2E — Playwright)

`#26`의 `e2e/fixtures/extension.ts`(context fixture), `e2e/fixtures/drag.ts`
(`dragBy`)를 그대로 재사용한다. `dragBy`가 `Locator`를 받으므로 pill(Button)에도
그대로 쓸 수 있어 신규 헬퍼가 필요 없다.

```ts
// e2e/widget-drag-move-pill.spec.ts (신규 — #26의 widget-drag-move.spec.ts와
// 별도 파일이라 향후 #28과도 파일이 안 겹친다)
import { test, expect } from './fixtures/extension';
import { dragBy } from './fixtures/drag';
```

- 접기 진입: `page.getByRole('button', { name: 'Codit 타이머 접기' })`(기존
  `panel-shell.tsx`의 `aria-label="Codit 타이머 접기"`) `.click()`
- pill 접근: `page.getByRole('button', { name: /Codit 타이머 펼치기/ })`
  (`collapsed-timer.tsx`의 sr-only 접근성 이름 "Codit 타이머 펼치기, 경과 시간 ")
- 펼쳐짐 확인: `page.getByText('풀이 타이머')`(헤더)가 다시 보임
- 안 펼쳐짐 확인: pill 이 계속 보이고 헤더는 안 보임

### 에러 케이스

이번 이슈 범위 밖 — `#26`과 동일하게 정상 플로우 검증(prd.md Out of Scope).

### 결정 사항

`#26` 패턴 재사용만으로 충분해 결정 포인트 없음.

---

## 테스트 시나리오

### 정상

- `[정상] pill 클릭 → 펼침` — 3px 미만 이동 후 떼면 pill 이 사라지고 헤더("풀이 타이머")가 다시 뜬다
- `[정상] pill 드래그 → 이동, 안 펼쳐짐` — 20px 드래그하면 pill 위치가 이동하고, 헤더는 뜨지 않는다(계속 collapsed)

### 경계

- `[경계] 드래그 임계값 직전` — 정확히 5px 미만(예: 4px) 이동은 클릭으로 처리되어 펼쳐진다 (`useWidgetPosition.ts`의 `DRAG_THRESHOLD_PX=5` 코드 확인 — 이미 Vitest로 단위 검증됐지만, 실제 브라우저 pointer 이벤트 기준으로도 동일하게 동작하는지는 E2E 고유 검증 대상)

### 예외

이슈 범위 밖 — pill 자체가 없는 상태(expanded)에서의 동작은 `#26`이 이미 검증했고, storage 실패 등은 prd.md Out of Scope.

---

## AC 커버리지

| AC | 커버 시나리오 |
|---|---|
| pill 클릭(5px 미만) → 펼침 | `[정상] pill 클릭 → 펼침`, `[경계] 드래그 임계값 직전` |
| pill 드래그(5px 이상) → 이동, 안 펼쳐짐 | `[정상] pill 드래그 → 이동, 안 펼쳐짐` |
