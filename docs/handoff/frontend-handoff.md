# Codit Frontend Handoff

> 이 문서는 새로운 설계 Source of Truth가 아니다.
> 지금까지 구현된 Frontend 상태 / 실행 방법 / ownership / 현재 mock과 실제 API 사이의 차이 / 다음 작업에서 먼저 확인할 것을 한 곳에서 안내하는 현황 문서다.
> PR #10을 리뷰하거나 이후 Frontend 작업을 이어받는 팀원을 대상으로 한다.

---

## 1. 현재 Frontend 구조

Codit 익스텐션(`apps/extension`, WXT + React + TypeScript + Tailwind v4)은 두 개의 UI Surface를 가진다.

### Floating Widget

- SWEA 문제 페이지에 주입되는 **Content Script** (`apps/extension/entrypoints/content/`)
- **Shadow DOM** 안에서 렌더 → host 페이지 CSS와 격리
- Timer 중심 UI, 폭 약 320px
- 화면 흐름 (`entrypoints/content/screens.ts`의 `Screen` 타입):
  `timer` → `result` → `memo` → `tags` → `success`
  (풀이 시간 측정 → 결과 선택 → 메모 → 태그 선택 → 저장 완료)

### Extension Page

- WXT **page entrypoint** (`apps/extension/entrypoints/page/`), 산출물은 `page.html`
- 일반 document surface (Shadow DOM 아님)
- `ExtensionPageShell` / `PageHeader` / `BrandHeader` 사용
- 현재 **Problem History Mock UI**가 구현되어 있다 (`entrypoints/page/history/`)
- **Auth 화면은 다른 FE 담당자가 구현 예정** (아래 4장 참고)

### semantic token 적용 방식

두 Surface는 **하나의 semantic token Source of Truth**(`apps/extension/styles/tokens.css`)를 공유하지만, 적용 지점이 다르다.

| Surface | 토큰 적용 대상 |
|---|---|
| Floating Widget | Shadow DOM `:host` |
| Extension Page | document `:root` |

Floating Widget은 `:host` 스코프 덕분에 host 페이지 스타일에 영향을 주지도, 받지도 않는다. #7에서 Extension Page를 추가하면서 이 공유 구조를 정리했고, Floating Widget 토큰 동작에는 회귀가 없음을 검증했다.

---

## 2. 현재 완료된 작업

### Timer / Floating Widget UI

구현됨:

- Timer, Result Select, 메모(Wrong/Correct), Tag selection, Save Complete 화면
- shadcn/ui 기반 UI primitive (`apps/extension/components/ui/*`: button, card, badge, toggle, toggle-group, collapsible, input, label, textarea)
- WXT + React + TypeScript + Tailwind v4

> **실제 API / storage 연결은 아직 하지 않았다.** 화면과 상태 전환만 구현되어 있고, 저장은 mock 동작이다.

관련 commit: `ba9072e` — `feat: implement timer UI`

### Issue #7 — Extension Page UI Foundation

**Status: COMPLETE**

- WXT Extension Page entrypoint (`index.html`, `main.tsx`, `style.css`)
- `ExtensionPageShell`, `PageHeader`, `BrandHeader`
- `apps/extension/styles/tokens.css` 를 semantic token Source of Truth로 확립
- Floating Widget token 회귀 없음

관련 commit: `ca6b713` — `feat: add extension page UI foundation`
상세: `docs/features/extension-page/issue-7.md`

### Issue #9 — Problem History Mock UI

**Status: COMPLETE**

- Problem List / Problem Detail 화면 전환
- Result Filter (전체 / 정답 / 오답 / 보류)
- Tag Filter (카테고리 패널, OR 조건) / Clear Filters (필터 해제)
- `ProblemCard`, `ResultBadge`, `TagChipList`
- `AttemptTimeline` / `AttemptItem`
- Empty / Filtered Empty / Not Found 상태
- Skeleton 로딩 상태
- mock history data (`entrypoints/page/history/mock-data.ts`)

관련 commit: `4e09ede` — `feat: add problem history mock UI`
상세: `docs/features/problem-history/issue-9.md`

검증:

- unit test **84/84 PASS**
- Acceptance Criteria **12/12 MET**
- security review PASS (실제 취약점 0건)
- Chrome 실제 렌더 확인
- Floating Timer 회귀 확인

---

## 3. 현재 PR

| 항목 | 값 |
|---|---|
| PR | **#10** |
| Title | `[FE] Timer · Extension Page · Problem History UI 구현` |
| Repository | `Yejin0O0/codit` |
| Base | `develop` |
| Head | `feat/fe-auth-history` |
| URL | https://github.com/Yejin0O0/codit/pull/10 |

포함 범위 (team/develop에 아직 반영되지 않은 4개 커밋):

1. Timer / Floating Widget UI (`ba9072e`)
2. UI Architecture / Design System 문서 (`08a873c`)
3. Extension Page Foundation — #7 (`ca6b713`)
4. Problem History Mock UI — #9 (`4e09ede`)

Closes:

- #7
- #9

> Timer UI는 별도로 team develop에 머지된 적이 없어 이 PR에 함께 실려 있다. PR 본문에서 범위를 축소하지 않고 4개 섹션으로 명시했다.

---

## 4. Auth Ownership — 중요

### Auth는 이 Frontend 작업의 담당 범위가 아니다

기존 Issue **#8 `[FE] Login / SignUp Mock UI`** 는 **Product Decision 변경으로 Not Planned 처리됨.**

최신 결정:

- Email/password Login 폐기
- Email/password SignUp 폐기
- **Social Login only**
- Auth UI / Social Login은 **다른 Frontend 담당자가 구현**

따라서 현재 코드에 다음이 **없는 것은 정상이다.**

- Login UI / SignUp UI
- OAuth / JWT
- accessToken / refreshToken
- `chrome.storage` 기반 auth
- Auth API 호출

### `docs/features/auth/ui-design.md` 는 stale 문서다

이 문서는 과거 Email/password 기반 Auth 설계 문서다. Product Decision이 Social Login only로 바뀌었으므로 **현재 Production Auth 구현의 Source of Truth로 사용하지 않는다.** Auth 담당자가 Social Login 기준으로 재설계해야 한다.

이번 PR에는 Auth Production 구현이 없다.

---

## 5. Problem History Product Rules (현재 mock 계약)

- **Problem : Attempt = 1 : N**
- Attempt result: `CORRECT` / `WRONG` / `HOLD`
- **Result Filter**: Problem의 가장 최근 Attempt(= 가장 높은 `seq`의 `result`) 기준
- **Problem-level `tagIds`** = 그 Problem에 속한 **모든 `Attempt.tagIds`의 unique union**
- 여러 tag 선택: **OR**
- Result + Tag: **AND**
- Detail 화면의 Attempt 목록: **`seq` 내림차순** (원본 배열을 복사한 뒤 정렬)

현재 이 타입들은 `apps/extension/entrypoints/page/history/types.ts` 의 **feature-local view model**이다.
`packages/shared-types` 는 수정하지 않았다.

`mock-data.ts`에는 `MOCK_PROBLEMS`(리스트)와 `MOCK_DETAILS`(상세)의 상호 정합성(위 규칙)을 강제하는 integrity 테스트가 있다 (`mock-data.test.ts`).

---

## 6. 실행 방법

프로젝트 root에서:

```bash
pnpm dev:ext
# 또는
pnpm --filter @codit/extension dev
```

> **PowerShell**에서 `pnpm.ps1` execution policy 오류가 나면 `pnpm.cmd` 를 사용한다.
> 예: `pnpm.cmd --filter @codit/extension dev`
> Git Bash에서는 `pnpm` 그대로 사용 가능하다.

Chrome:

1. `chrome://extensions` → 개발자 모드 → WXT dev 산출물(`apps/extension/.output/chrome-mv3`) 로드 (dev 서버가 자동 로드하기도 함)
2. 확장 목록에서 Codit 익스텐션의 `EXTENSION_ID` 확인

Extension Page 직접 접근:

```
chrome-extension://<EXTENSION_ID>/page.html
```

### initialAuthed 관련 주의

`entrypoints/page/App.tsx` 의 기본값은 `useState(initialAuthed ?? false)` 이다.

- Auth가 연결되기 전에는 기본 접근 시 **unauthenticated placeholder**가 나오는 것이 정상이다.
- Problem History 실제 화면은 dev/테스트 검증에서 `initialAuthed=true` 경로로 확인해 왔다.
- **History 노출을 위해 production auth bypass(쿼리 파라미터, dev flag 등)를 추가하지 않는다.** Auth 담당자가 실제 인증 상태를 연결하면 자연스럽게 열린다.

---

## 7. 테스트 / 빌드

```bash
pnpm --filter @codit/extension typecheck
pnpm --filter @codit/extension lint
pnpm --filter @codit/extension test
pnpm --filter @codit/extension build
```

현재 기준:

- typecheck PASS (0 errors)
- lint PASS
- unit test **84/84 PASS**
- build PASS (EXIT 0)

`pnpm test:e2e` (root, `playwright test`):

- 현재 `e2e/` 테스트 시나리오가 없어 **`Error: No tests found`** 상태다.
- 이는 **기능 회귀 실패가 아니라** E2E 테스트 인프라/시나리오가 아직 구축되지 않은 상태다.
- 이번 PR의 검증 게이트인 typecheck / lint / unit test / build는 모두 통과했다.

---

## 8. 다음 FE API Integration에서 반드시 확인할 것

아래 3가지는 **구현 전에 팀(특히 Backend) 계약 확정이 필요하다.** 확정 전 임의 구현하지 않는다.

### A. Problem 식별 / `POST /api/problems` 와 normalizedUrl

`packages/shared-types` 의 `Problem` 은 현재 `{ id, title, number, difficulty, tags, url }` 형태다.

새 FE 논의에서 요청 시 `normalizedUrl` 전송 이야기가 추가되었다. 확정 필요:

- `url`(normalizedUrl) 필드를 실제 API Request에 넣을지
- 아니면 FE 내부 normalization 용도로만 쓸지

SWEA 문제 id 파싱 후보:

```ts
const url = new URL(window.location.href);
const contestProbId = url.searchParams.get('contestProbId');
```

정규화 URL 후보:

```
https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=<id>
```

> `categoryId` 없이 실제 문제 페이지가 항상 정상 접근되는지는 **실제 SWEA 여러 문제에서 먼저 검증**해야 한다. SWEA 진입 경로가 하나가 아닐 수 있다.

### B. result enum 통일 (현재 3-way 불일치)

| 위치 | 값 |
|---|---|
| FE History mock (`entrypoints/page/history/types.ts`) | `CORRECT` \| `WRONG` \| `HOLD` |
| `packages/shared-types` (`Attempt.result`, 현재 코드) | `CORRECT` \| `WRONG` \| `TIMEOUT` \| `COMPILE_ERROR` |
| Attempt API draft (팀 논의) | `CORRECT` \| `WRONG` \| `GIVE_UP` |

API 연결 전에 반드시 하나로 통일해야 한다. 특히 `HOLD` / `GIVE_UP` / `TIMEOUT` 중 무엇을 쓸지 합의 없이 바꾸지 않는다.

### C. Attempt Tag payload

| 위치 | 형태 |
|---|---|
| `packages/shared-types` (`Tag`, 현재 코드) | `{ id, name }` (category 없음) |
| FE mock taxonomy | `{ id, name }` + `TAG_CATEGORIES`로 카테고리 그룹핑 |
| Tag API 논의 | `{ id, name, category }` |
| Attempt API draft | `tags: string[]` (예: `["DFS", "그리디"]`) |

`tagId[]` 를 보낼지 `name[]` 을 보낼지 팀 확정이 아직 필요하다. 확정 전 임의 구현하지 않는다.

---

## 9. 다음 추천 Frontend 작업

Auth가 아니라 다음 순서를 추천한다.

1. SWEA Problem Identification
2. URL normalization 검증
3. `POST /api/problems` Integration
4. `GET /api/tags` Integration
5. Attempt Save API Integration

### 추천 Issue 분리

**[FE] SWEA Problem Identification & API Integration**

- `contestProbId` parsing
- SWEA 진입 경로(들) 대응
- invalid / missing `contestProbId` 처리
- normalized URL 검증
- `POST /api/problems` 연결

**[FE] Tag API Integration**

- `GET /api/tags`
- CORE / category grouping
- 현재 mock taxonomy 제거 / 대체

**[FE] Attempt Save API Integration**

- `problemId`, `elapsedTime`, `result`, `tags`, `memo`
- 최종 `POST /api/attempts` 연결

---

## 10. Integration Boundary

### `apps/extension/entrypoints/page/App.tsx`

이 파일은 다른 담당자와 **충돌 가능성이 높다.**

- 현재 Problem History 연결이 여기 있다 (`isAuthed` 분기 → `<HistoryView />`)
- 향후 Auth 담당자가 인증 상태와 Extension Page 진입을 여기서 연결할 가능성이 높다

따라서 새 feature는 가능한 한 `apps/extension/entrypoints/page/<feature>/**` 내부에 격리하고, `App.tsx` 수정은 **최소 integration만** 한다 (import 1개 + 렌더 연결 정도).

---

## 11. 하지 말아야 할 것

- email/password Login / SignUp 복구
- Auth mock 새로 구현
- History mock에 맞추려고 `packages/shared-types` 임의 수정
- Timer / History tag taxonomy 공통화 작업을 다른 기능 작업 중간에 끼워 넣기
- `HOLD` / `GIVE_UP` / `TIMEOUT` 을 합의 없이 변경
- Tag payload를 `tagId[]` / `name[]` 중 하나로 합의 없이 확정
- `normalizedUrl` 을 Backend 계약 없이 API request에 추가
- production auth bypass 추가

---

## 12. 관련 문서

- `docs/ui/ui-architecture.md`
- `docs/ui/design-system.md`
- `docs/features/timer/ui-design.md`
- `docs/features/extension-page/issue-7.md`
- `docs/features/problem-history/ui-design.md`
- `docs/features/problem-history/issue-9.md`
- `docs/features/auth/ui-design.md` — ⚠️ **stale.** 과거 Email/password 설계. 현재 Auth 구현 기준으로 사용하지 말 것 (4장 참고).
