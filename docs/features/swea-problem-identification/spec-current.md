# SWEA Problem Identification — AS-BUILT Current Spec

**Status: AS-BUILT / Retrospective.** PR #10 (`0fda5f6`, `team/develop` 머지)까지의
실제 구현·테스트·리뷰 결과만 기록한다. 새 요구사항을 만들어내지 않는다.

Timer Core 내부 Capability 가 아니라 **독립 Feature** 로 분리한다 — "위젯이 어느
페이지에서, 어떤 문제로 뜨는가" 는 Timer flow 와 별개의 계약이고, 후속 확장
(`solvingProblem.do` DOM fallback 등)이 이 Feature 단위로 진행되기 때문이다.

---

## 사용자 목적

Codit Floating Widget 이 **SWEA 문제 페이지에서만** 뜨고, 문제 페이지가 아니면 SWEA
사용을 전혀 방해하지 않는다. 위젯이 뜰 때는 현재 문제를 식별해 Timer 에 전달한다.

---

## 현재 구현된 동작

### 1. Content script 주입 대상

`content/index.tsx` 의 `defineContentScript({ matches: [...] })`:

```
'*://swexpertacademy.com/*'
'*://*.swexpertacademy.com/*'
```

`main()` 은 `mountCoditWidget()` 만 호출한다. (이전엔 `*://*.google.com/*` 였음 —
`f0b37b3` 에서 교정.)

### 2. 문제 식별 — 현재는 URL 쿼리 스트링만

`parseContestProbId(href)` (`content/problem/parse-contest-problem-id.ts`):

- `new URL(href).searchParams.get('contestProbId')` 를 시도한다.
- 파싱 불가(비-URL) → `null`.
- 값이 없거나 빈 문자열 → `null`.
- 값이 있으면 **대소문자 그대로** 반환.

지원되는 SWEA 경로 = URL 에 `?contestProbId=` 를 가진 페이지:

| 경로 | 예 |
|---|---|
| `problemDetail.do` | `.../problemDetail.do?contestProbId=AZ8R8haaeYnHBITH` |
| `solvingClub/.../problemView.do` | `.../problemView.do?contestProbId=...&clubId=...` |

### 3. Widget mount 게이트 (`mountCoditWidget`)

`content/mount.tsx` 의 `mountCoditWidget(href = window.location.href): boolean`:

1. `parseContestProbId(href)` → `null` 이면 **아무것도 하지 않고 `false` 반환**
   (fail-soft: `#codit-root` 도, Shadow DOM 도, Timer 도 만들지 않음).
2. `#codit-root` 가 이미 있으면 `false` 반환 (중복 mount 가드).
3. 그 외:
   - `<div id="codit-root">` 를 `position: fixed; top: 20px; right: 20px; z-index: 999999`
     로 `document.body` 에 붙임.
   - `container.attachShadow({ mode: 'open' })`.
   - 번들 CSS 를 `css.replaceAll(':root', ':host')` 로 치환해 `<style>` 로 주입.
   - `ReactDOM.createRoot(app).render(<App problemId={problemId} />)`.
   - `true` 반환.

DOM/Shadow/React mount 로직을 `index.tsx` 에서 `mount.tsx` 로 분리했다(`f0b37b3`).
디버그 `console.log` 는 제거됨.

---

## 현재 상태 / 데이터 모델

| 개념 | 형태 | 비고 |
|---|---|---|
| `contestProbId` | `string` | 현재는 URL `?contestProbId=` 에서만 추출 |
| `mountCoditWidget` 반환 | `boolean` (mount 여부) | |
| `#codit-root` | 단일 DOM 노드 (Shadow host) | 중복 mount 가드의 기준 |

세션·저장 개념은 이 Feature 에 없다 (Timer Session 은 `timer-persistence` 소관).

---

## 주요 Production 코드

| 파일 | 역할 |
|---|---|
| `apps/extension/entrypoints/content/index.tsx` | `defineContentScript` — `matches`, `main()` → `mountCoditWidget()` |
| `apps/extension/entrypoints/content/mount.tsx` | `mountCoditWidget` — 식별 게이트 + Shadow DOM + React mount + 중복 가드 |
| `apps/extension/entrypoints/content/problem/parse-contest-problem-id.ts` | `parseContestProbId(href)` — 순수 URL 파서 |

프로덕션 manifest 에 추가된 권한: **없음** (dev manifest 의 `tabs`/`scripting`/
`host_permissions`/`localhost` 는 WXT 가 HMR 용으로만 주입하는 dev 전용).

---

## 현재 Test 가 보장하는 동작

| 파일 | 보장 |
|---|---|
| `content/problem/parse-contest-problem-id.test.ts` (7) | `problemDetail.do` URL 추출 · `solvingClub problemView.do` URL 추출 · 다른 query parameter 많아도 `contestProbId` 만 · 없으면 null(2 케이스) · 빈 값이면 null · 비-URL 문자열이면 null · 대소문자 그대로 보존 |
| `content/mount.test.tsx` (3) | `contestProbId` 없으면 DOM 을 만들지 않는다 · SWEA 문제 페이지에서는 Shadow DOM 위젯 root 를 mount 한다 · root 가 이미 있으면 다시 mount 하지 않는다 |

---

## Resolved Review Feedback

| Commit | 피드백 | 확정 |
|---|---|---|
| `f0b37b3` `fix: target SWEA and gate codit widget mount on a problem page` | content script `matches` 가 `*://*.google.com/*`; 위젯이 문제 페이지 판별 없이 mount | `matches` = SWEA 로 교정. `mountCoditWidget` 이 `contestProbId` 유무로 게이트 — 없으면 `#codit-root`·Shadow·Timer 를 만들지 않는다(fail-soft). DOM/mount 로직을 `mount.tsx` 로 분리. `parseContestProbId` 순수 함수. `MOCK_PROBLEM` 제거 → `App` 이 `problemId` prop |

---

## Regression Constraints

1. **fail-soft mount** — `contestProbId` 를 얻지 못하면 `#codit-root`·Shadow DOM·Timer
   를 만들지 않고 SWEA 화면(DOM/스타일)을 건드리지 않는다. 사용자에게 보이는
   에러·alert·배지 없음.
2. **중복 mount 가드** — 같은 document 에 `#codit-root` 가 이미 있으면 재 mount 하지
   않는다.
3. **`parseContestProbId` 순수성** — `href` 문자열만 받는 순수 함수를 유지한다.
   URL 값은 대소문자 변환 없이 그대로 반환한다. 새 식별 경로가 필요하면 이 함수를
   깨지 않고 그 위에 얹는다.
4. **`mountCoditWidget` 구조** — 시그니처와 root/Shadow/React render 조립 구조를
   유지한다. 식별 로직은 `content/problem/` 모듈에 모은다(인라인 금지).

---

## Known Gaps

- **`solvingProblem.do` 미지원** — 이 페이지는 URL 에 `?contestProbId=` 가 없고
  DOM `input#contestProbId` hidden input 에만 문제 식별자가 있다(오픈소스 SWEA
  익스텐션 3종 교차 확인, 로그인 상태 실측은 미수행). 현재 `parseContestProbId` 는
  URL 만 보므로 `solvingProblem.do` 에서는 위젯이 뜨지 않는다.
- **hidden input 지연 등장 대응 없음** — DOM 관찰(MutationObserver) 미구현.
- **문제 identity 변경 감지 없음** — 현재는 문제 전환 = 새 document load = content
  script 재실행 전제. same-document 변경 감지 없음.
- **모의 테스트 / Contest Problem / User Problem / Code Battle** 경로 구분 없음
  (현재는 `?contestProbId=` 유무로만 게이트).

---

## Follow-up

- **`timer-persistence` Issue #3 — SWEA 문제 페이지 간 continuity** 가 이 Gap 을
  커버한다: `resolveProblemId(doc, href)` = URL → DOM `#contestProbId` /
  `input[name="contestProbId"]` fallback, hidden input 지연 등장 시 MutationObserver
  로 관찰→식별→mount→disconnect, 로그인/식별 불가 페이지 미표시.
  (`docs/features/timer-persistence/{spec-fixed.md,prd.md ADR-1,issues.md#Issue 3}`)
- **구현 전 검증** — 로그인된 `solvingProblem.do` 에서
  `document.querySelector('input#contestProbId')?.value` 및 fallback 셀렉터를 1회
  실측(현재 미수행). `docs/features/timer-persistence/spec-fixed.md` "구현 전 검증 항목".

---

## Deferred

- same-document(SPA) 문제 전환 감지 (SWEA 가 SPA 로 바뀔 경우).
- `chrome.scripting` 재주입 / MAIN world 스크립트.

---

## 관련 Commit

`f0b37b3`(핵심 — matches 교정 + mount 게이트 + mount.tsx 분리 + parseContestProbId) ·
`5702ef4`(테스트 설명 한국어).
