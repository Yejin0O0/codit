# 프론트엔드 백엔드 API 연동 이슈 목록

## Issue A: [api-integration] 위젯 — 결과 기록 저장 API 연동

### 설명
`handleSave`가 현재 `setScreen('success')`만 호출하는 상태를 실제 `POST /api/attempts` 호출로 교체한다.
`useSaveAttempt` 훅을 신규 생성하고 App.tsx에 배선한다. shadcn Toast를 설치하고, 저장 실패 시 토스트 + 경고 아이콘을 표시한다. 저장 중 버튼에 스피너를 표시하고 비활성화한다.

신규 파일:
- `apps/extension/src/hooks/useSaveAttempt.ts`

### 완료 조건 (Acceptance Criteria)
- [ ] 저장 버튼 클릭 시 `POST /api/attempts`가 `authenticatedFetch`로 호출된다
- [ ] 요청 바디에 `problemId`, `elapsedTime`, `result`, `tagIds`, `memo`가 포함된다
- [ ] 저장 성공 시 success 화면으로 전환된다
- [ ] 저장 중 버튼에 스피너가 표시되고 중복 클릭이 비활성화된다
- [ ] 저장 실패 시 shadcn 토스트가 표시된다
- [ ] 저장 실패 시 저장 버튼 옆 경고 아이콘이 유지된다
- [ ] 저장 버튼 재클릭 시 API를 재시도한다

### 시나리오

**시나리오 A — 저장 성공**

**Given** 사용자가 결과 선택 → 태그 선택 → 메모 입력을 완료했다
**When** 저장 버튼을 클릭한다
**Then** 백엔드에 기록이 저장되고 success 화면으로 전환된다

**시나리오 B — 저장 실패 후 재시도**

**Given** 저장 API 호출이 실패해 경고 아이콘이 표시된 상태이다
**When** 저장 버튼을 다시 클릭한다
**Then** API 요청을 재시도한다

---

## Issue B: [api-integration] 위젯 — 태그 조회/등록 API 연동

### 설명
TagSelectScreen이 현재 `mockData.ts`의 태그 목록을 사용하는 부분을 `GET /api/tags` 실제 호출로 교체한다.
커스텀 태그 추가 시 `POST /api/tags`를 호출하도록 한다.
`useTags` 훅을 신규 생성하고 App.tsx에 배선한다.

신규 파일:
- `apps/extension/src/hooks/useTags.ts`

### 완료 조건 (Acceptance Criteria)
- [ ] 태그 선택 화면 진입 시 `GET /api/tags`가 `authenticatedFetch`로 호출된다
- [ ] 서버에서 받은 태그 목록이 화면에 표시된다 (mockData 대체)
- [ ] 태그 조회 중 로딩 상태가 표시된다
- [ ] 태그 조회 실패 시 인라인 에러와 재시도 UI가 표시된다
- [ ] 커스텀 태그 추가 시 `POST /api/tags`가 `authenticatedFetch`로 호출된다
- [ ] 커스텀 태그 등록 성공 시 목록에 즉시 반영된다
- [ ] 커스텀 태그 등록 실패 시 인라인 에러가 표시된다

### 시나리오

**시나리오 A — 태그 목록 조회**

**Given** 사용자가 태그 선택 화면에 진입했다
**When** 화면이 로드된다
**Then** 서버에서 태그 목록을 조회해 표시한다

**시나리오 B — 커스텀 태그 등록**

**Given** 사용자가 TagPicker에서 직접 태그 이름을 입력했다
**When** 추가 버튼을 클릭한다
**Then** 서버에 태그를 등록하고 목록에 반영한다

---

## Issue C: [api-integration] 익스텐션 페이지 — 히스토리 조회 API 연동

### 설명
`use-problem-history.ts`와 `use-problem-detail.ts`가 현재 `mock-data.ts`를 사용하는 부분을 실제 API 호출로 교체한다.
`GET /api/attempts` (목록)와 `GET /api/attempts/{id}` (상세) 엔드포인트가 필요하다.

> **의존**: 이슈 #88 (백엔드 `GET /api/attempts` 엔드포인트 구현)이 완료된 후 진행한다.
> 이슈 #88의 내용에 히스토리 연동을 위해 이 이슈가 선행되어야 함을 명시해야 한다.

### 완료 조건 (Acceptance Criteria)
- [ ] 히스토리 탭 진입 시 `GET /api/attempts`가 `authenticatedFetch`로 호출된다
- [ ] 풀이 목록이 실제 데이터로 표시된다 (MOCK_PROBLEMS 대체)
- [ ] 목록이 비어있을 때 "기록 없음" 상태가 표시된다
- [ ] 목록 조회 실패 시 인라인 에러 상태가 표시된다
- [ ] 항목 클릭 시 `GET /api/attempts/{id}`가 호출돼 상세 기록이 표시된다

### 시나리오

**시나리오 A — 히스토리 목록 조회**

**Given** 사용자가 익스텐션 페이지를 열었다
**When** 히스토리 탭에 진입한다
**Then** 서버에서 풀이 목록을 조회해 표시한다

**시나리오 B — 히스토리 빈 목록**

**Given** 사용자가 아직 아무 문제도 풀지 않았다
**When** 히스토리 탭에 진입한다
**Then** "기록 없음" 메시지가 표시된다
