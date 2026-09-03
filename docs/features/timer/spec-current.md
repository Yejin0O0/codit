# Timer Core — AS-BUILT Current Spec

**Status: AS-BUILT / Retrospective.** PR #10 (`0fda5f6`, `team/develop` 머지)까지의
실제 구현·테스트·리뷰 결과만 기록한다. 새 요구사항을 만들어내지 않는다.
UI 와이어프레임은 [`ui-design.md`](./ui-design.md) 를 참조한다.

---

## 사용자 목적

SWEA 문제를 푸는 동안 풀이 시간을 측정하고, 완료 후 결과(정답/오답/보류)·메모·태그를
한 흐름으로 기록한다. Codit Floating Widget 의 핵심 기능이다.

---

## 현재 구현된 동작

Floating Widget 은 content script 로 SWEA 문제 페이지 위 Shadow DOM(open)에 뜨며,
`<App problemId={contestProbId} />` 하나가 아래 화면 상태머신을 소유한다.

```
timer ──"완료"(타이머 정지)──▶ result ──정답/오답/보류 택1 + "다음"──▶
    ├ 정답 / 오답 → memo (선택 입력) ──"다음"──▶ tags
    └ 보류        → (memo 건너뜀)          ──────▶ tags
tags ──태그 ≥ 1 + "저장"──▶ success (피드백)
```

- `screen: 'timer' | 'result' | 'memo' | 'tags' | 'success'` — `App` 이 `useState` 로 소유.
- `result: 'CORRECT' | 'WRONG' | 'HOLD' | null`. HOLD 는 `memo` 화면을 거치지 않는다
  (`handleNextFromResult` 가 memo 초기화 후 tags 로).
- 스텝 인디케이터: `result` 가 CORRECT/WRONG → memo `2 / 3`, tags `3 / 3`.
  HOLD → tags `2 / 2`. result 화면은 분기 전이라 미표기.
- "완료" 클릭 → `useTimer.stop()` (경과 시간 고정) 후 `result` 로. "완료" 화면 이후
  타이머는 다시 흐르지 않는다.
- 메모는 선택 입력 — 작성하지 않아도 "다음" 진행 가능. WRONG 은 Textarea 자동 노출,
  CORRECT 는 "메모 추가하기" 클릭 시 확장(`memoOpen`).
- 태그: 핵심 11 + "더보기"(7 대분류 섹션) + 직접 입력. `selectedTagIds` 는 `App` 이
  소유하는 단일 선택 집합. "저장" 은 태그 ≥ 1 일 때만 활성.
- `success` 화면은 결과·풀이 시간·태그·메모 요약을 표시한다. 그 이후 패널 동작은
  현재 구현 밖.

### Capability: 경과 시간 계산 (`useTimer`) — wall-clock 기반

- `useTimer()` 는 `{ elapsedSeconds, stop }` 를 반환한다.
- `startedAt` 은 첫 effect 실행 시 `Date.now()` 로 한 번 잡힌다(`useRef`, effect 내부
  lazy 초기화 — render 중 `Date.now()` 호출하지 않음).
- 경과 시간 = `Math.floor((기준시각 - startedAt) / 1000)`. 기준시각은 running 이면
  현재 시각, `stop()` 이후면 `stop()` 시점.
- `setInterval(recompute, 500)` 은 **화면 재계산 트리거** 역할만 한다. tick 콜백
  횟수를 누적하지 않는다 — 콜백이 지연·병합되어도(백그라운드 스로틀링, 절전) 표시값이
  실제 경과 시간과 어긋나지 않는다.
- `stop()` 은 `setRunning(false)` 전에 마지막 tick 이후 흐른 시간까지 반영해 최종
  `elapsedSeconds` 를 벽시계 기준으로 정확히 고정한다.
- unmount 시 `clearInterval`.

### Capability: Custom Tag Resolution (`resolveCustomTagInput`)

- 태그 화면 직접 입력에서, 입력한 이름이 기존 predefined/custom 태그와 같으면
  (id 일치 또는 이름 대소문자 무시 일치) **기존 태그 id 를 선택**하고 새 `custom:<name>`
  id 를 만들지 않는다.
- `toCustomTagId(name)` = `custom:` + `trim().toLowerCase().replace(/\s+/g, '-')`.
- `resolveCustomTagInput(rawName, knownTags)`:
  - trim 후 빈 문자열 → `null` (무시).
  - 기존 태그 발견 → `{ tag: 기존태그, isNew: false }`.
  - 그 외 → `{ tag: { id: toCustomTagId, name: trimmed }, isNew: true }`.
- `App.handleAddCustomTag` 는 `isNew` 일 때만 `customTags` 에 추가하고, 결과 `tag.id`
  를 `selectedTagIds` 에 병합한다.

### Capability: Widget mount

- 위젯이 어디서 mount 되는지(=SWEA 문제 식별)는 **별도 Feature** 로 분리했다 —
  [`../swea-problem-identification/spec-current.md`](../swea-problem-identification/spec-current.md).
  Timer 는 `mountCoditWidget` 이 확정한 `problemId` 를 prop 으로 받는다.

---

## 현재 상태 / 데이터 모델

전부 **클라이언트 in-memory (mock)**. 실제 API·`chrome.storage`·백엔드 없음.

| 개념 | 형태 | 소유/출처 |
|---|---|---|
| `problemId` | `string` (contestProbId) | `mountCoditWidget` → `<App problemId>` prop |
| `screen` | `'timer'\|'result'\|'memo'\|'tags'\|'success'` | `App` state |
| `result` | `'CORRECT'\|'WRONG'\|'HOLD'\|null` | `App` state |
| `memo` / `memoOpen` | `string` / `boolean` | `App` state |
| `selectedTagIds` | `string[]` | `App` state |
| `customTags` | `{ id, name }[]` (`Tag = TagOption`) | `App` state (직접 입력분) |
| `elapsedSeconds` | `number` (초) | `useTimer` (wall-clock 계산, 저장 안 함) |
| 태그 카탈로그 | `CORE_TAGS` / `TAG_CATEGORIES` / `TAG_CATALOG` | `@/lib/tag-catalog` 재노출 (`content/mockData.ts`) — [Decision](../../decisions/tag-catalog-single-source-of-truth.md) |
| 문제 mock (`MOCK_PROBLEM`) | — | **제거됨** (`f0b37b3`) — 이제 `problemId` prop |

"저장"(success 도달)은 UI 피드백만 표시하고 어디에도 persist 하지 않는다.

---

## 주요 Production 코드

| 파일 | 역할 |
|---|---|
| `apps/extension/entrypoints/content/App.tsx` | 화면 상태머신, 완료/다음/저장 핸들러, `handleAddCustomTag` |
| `apps/extension/entrypoints/content/useTimer.ts` | wall-clock 경과 시간 훅, `stop()` |
| `apps/extension/entrypoints/content/screens.ts` | `Screen`, `ResultType`, `RESULT_LABELS`, `RESULT_OPTIONS` |
| `apps/extension/entrypoints/content/screens/{Timer,ResultSelect,Memo,TagSelect,SaveSuccess}Screen.tsx` | 화면별 뷰 |
| `apps/extension/entrypoints/content/components/{MemoField,ResultToggleGroup,TagPicker}.tsx` | 화면 내부 조합 |
| `apps/extension/entrypoints/content/tag-input.ts` | `toCustomTagId`, `resolveCustomTagInput` |
| `apps/extension/entrypoints/content/mockData.ts` | 태그 카탈로그 재노출(`@/lib/tag-catalog`), `type Tag = TagOption` |
| `apps/extension/components/codit/{codit-widget,panel-shell,timer-display,tag-toggle-group,result-badge}.tsx` | 공용 조합 (`PanelShell` = Card EXTEND, 헤더 슬롯) |
| `apps/extension/entrypoints/content/style.css` | 위젯 번들 CSS (`:root`→`:host` 치환, 320px, 시스템 폰트) |
| `apps/extension/lib/format-duration.ts` | `mm:ss` 포맷 |

---

## 현재 Test 가 보장하는 동작

| 파일 | 보장 |
|---|---|
| `content/App.test.tsx` (6) | 주입 `problemId` 를 타이머 화면에 표시 · "완료" → 결과 선택 화면 · 오답 → 메모(step 2/3) 후 태그 · 보류 → 메모 건너뛰고 태그(step 2/2) · 태그 1개 이상 전엔 "저장" 비활성 · predefined 와 같은 이름 직접 입력 시 기존 tag 선택 |
| `content/useTimer.test.ts` (6) | 초기 0 · 1초 후 1 · 5초 후 5 · interval callback 병합돼도 실제 경과 시간 기준 · tick 사이 stop 해도 실제 경과 시간으로 고정 · unmount 시 interval 정리 |
| `content/tag-input.test.ts` (6) | `toCustomTagId` 공백/소문자/하이픈 · 빈 입력 → null · "DFS" → 기존 `dfs` (isNew=false, `custom:dfs` 아님) · 대소문자 무시 매칭 · 이미 추가한 custom 재사용 · 일치 없으면 새 custom |
| `components/codit/{result-badge,tag-chip-list}.test.tsx` | 결과 라벨 매핑 · tag chip 렌더/미존재 tagId 스킵 |

(위젯 mount 자체의 테스트는 `content/mount.test.tsx` — SWEA Problem Identification 문서 참조.)

---

## Resolved Review Feedback

| Commit | 피드백 | 확정 |
|---|---|---|
| `f383399` `refactor: use wall-clock time for the solve timer` | `setElapsedSeconds(prev => prev + 1)` 은 콜백 횟수와 실제 시간이 어긋남(스로틀링·절전) | `Date.now()` 기준 계산으로 전환. interval 은 재계산 트리거만. `stop()` 은 마지막 tick 이후 시간까지 반영해 정확히 고정. `useRef` 로 `startedAt` 을 effect 내부 lazy 초기화(`react-hooks/purity` 준수) |
| `eda6141` `fix: reuse existing tag when adding duplicate custom tag` | duplicate 감지해도 `selectedTagIds` 에 존재하지 않는 `custom:<name>` id 가 들어가 카탈로그와 불일치 | 판정 로직을 순수 함수 `resolveCustomTagInput` 로 추출. 이름 일치 시 기존 tag id 재사용. 회귀 테스트 포함 |
| `f0b37b3` (부분) | `MOCK_PROBLEM` 고정 problemId 사용 | 제거 → `App` 이 `problemId` prop 을 받음 (URL 파싱은 mount 책임) |

---

## Regression Constraints

이후 어떤 작업(특히 `timer-persistence`)도 아래를 깨지 않는다.

1. **wall-clock 시간 계산** — 경과 시간의 SoT 는 `floor((기준시각 - startedAt) / 1000)`.
   `setInterval` 콜백 횟수 누적을 시간의 SoT 로 쓰지 않는다. `stop()` 의 "마지막 tick
   이후 시간까지 정확히 고정" 동작을 유지한다. render 중 `Date.now()` 호출 금지.
2. **Custom Tag Resolution** — 이름 일치 시 기존 tag id 재사용, 존재하지 않는
   `custom:<name>` id 를 선택 상태에 넣지 않는다. `resolveCustomTagInput` 순수 함수를
   유지한다(App 에 인라인 복원 금지).
3. **태그 카탈로그** — Timer 는 `@/lib/tag-catalog` 를 재노출/재사용만 한다. 물리
   복제 금지 ([Decision](../../decisions/tag-catalog-single-source-of-truth.md)).
4. **화면 상태·입력값의 소유** — `screen`·`result`·`memo`·`memoOpen`·`selectedTagIds`·
   `customTags` 는 `App` 이 소유한다. 하위 화면 subtree 의 subtree-local state 로
   내리지 않는다(collapse/expand 시 subtree 가 unmount 될 수 있으므로 —
   `timer-persistence` ADR-5).

---

## Known Gaps

- 저장이 mock — "저장"(success 도달) 시 결과/시간/태그/메모가 어디에도 persist 되지
  않는다. 서버/로컬 저장 없음.
- 타이머가 화면이 열린 동안만 이어진다 — 새로고침·페이지 이동·위젯 접기로 초기화된다.
- 문제 제목·난이도 등 문제 메타데이터는 표시하지 않는다(`problemId` 만).
- `TagPicker` 의 직접 입력 미제출 텍스트(`draft`)·"더보기" 펼침 여부는 `App` 이 아니라
  subtree-local state 다(현재는 collapse 개념이 없어 무해).

---

## Follow-up

- **Timer Session Continuity (`timer-persistence`)** — 새로고침·페이지 이동·접기/펼치기
  간 타이머 연속성 + Widget collapse/expand UI. `docs/features/timer-persistence/`
  (spec-fixed / prd / ui-design / issues 확정). PR #10 후속 Feature.
- **Attempt Save API 연동** — "저장" 시 실제 백엔드 저장. 계약 mismatch(result enum
  3-way, tag payload, normalizedUrl)는 `docs/handoff/frontend-handoff.md` §8 참조.
  이 Timer 상태를 Adapter 로 API 입력에 변환하는 방향(계약 확정 후).

---

## Deferred

- pause / resume / reset.
- 타이머 UI 변경(리셋 버튼, 누적 시간 표시 등).
- cross-device 동기화.

---

## 관련 Commit

`ba9072e`(핵심 구현) · `f0b37b3`(mount 분리 + `MOCK_PROBLEM` 제거) · `f383399`(wall-clock)
· `eda6141`(custom tag resolution) · `6971b55`(태그 카탈로그 SoT) · `321f54c`(lint) ·
`5702ef4`(테스트 설명 한국어).
