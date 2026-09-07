# Issue 28: [e2e-infra] 다중 탭 storage 동기화 검증

## 시그니처

### 프론트엔드 (TypeScript, E2E — Playwright)

`#26`의 `e2e/fixtures/extension.ts`(context fixture), `drag.ts`(`dragBy`),
`widget.ts`(`getWidgetPosition`)를 그대로 재사용한다. 신규 헬퍼 없음 — 같은
`context`에서 `newPage()`를 두 번 호출해 탭 두 개를 연다.

```ts
// e2e/widget-drag-move-multi-tab.spec.ts (신규 — #26/#27과 별도 파일)
import { test, expect } from './fixtures/extension';
import { dragBy } from './fixtures/drag';
import { getWidgetPosition } from './fixtures/widget';
```

- 탭 A/B 모두 동일한 mock 문제 페이지로 이동
- 탭 A 헤더 드래그 → `getWidgetPosition(pageA)`로 최종 위치 확보
- 탭 B는 `storage.onChanged` 구독을 거쳐 비동기로 갱신되므로,
  `expect.poll(() => getWidgetPosition(pageB)).toEqual(...)`로 대기
  (`waitForTimeout` 대신 — best-practices.md)

### 에러 케이스

이번 이슈 범위 밖 — `#26`/`#27`과 동일하게 정상 플로우 검증.

### 결정 사항

`#26` 패턴 재사용만으로 충분해 결정 포인트 없음.

---

## 테스트 시나리오

### 정상

- `[정상] 다중 탭 동기화` — 탭 A에서 드래그하면 탭 B의 위젯도 같은 위치로 이동한다

### 경계

- `[경계] 드래그 중인 탭은 자기 자신의 변경으로 흔들리지 않는다` — 탭 A가 드래그 중일 때(`isDraggingRef`) 자신의 최종 위치가 흔들림 없이 확정값으로 유지된다(코드상 드래그 중 자기 자신의 storage.onChanged는 무시하도록 설계돼 있어, 드래그 종료 후 최종 위치가 드래그가 끝낸 지점과 정확히 일치하는지로 간접 검증)

### 예외

이슈 범위 밖 — storage 실패 등은 prd.md Out of Scope.

---

## AC 커버리지

| AC | 커버 시나리오 |
|---|---|
| 탭 A/B 모두 같은 mock 페이지 | `[정상] 다중 탭 동기화` (사전 조건) |
| 탭 A 드래그 → 탭 B도 같은 위치로 이동 | `[정상] 다중 탭 동기화` |
