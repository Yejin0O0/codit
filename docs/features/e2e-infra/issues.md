# e2e-infra 이슈 분해

> 3개 Vertical Slice. Issue 1은 인프라 + 시나리오 A를 함께 묶는다(인프라만
> 따로 떼면 수평 슬라이싱이 되어 완료 시점에 눈에 보이는 동작이 없기
> 때문). Issue 2/3는 Issue 1의 인프라를 재사용하며, **직렬 분기**로
> Issue 1 브랜치가 develop에 머지된 뒤 그 tip에서 분기한다.

## Issue 1: [e2e-infra] Playwright 확장 로드 인프라 + 헤더 드래그 위치 영속 검증

### 설명
`e2e/` 디렉터리 신설. `launchPersistentContext` + `--load-extension`으로
빌드된 확장을 실제 Chrome에 로드하고, `context.route()`로
`swexpertacademy.com` 요청을 가로채 mock 문제 페이지를 서빙하는 fixture를
만든다. 이 인프라 위에서 시나리오 A(헤더 드래그 → 위치 저장 → 새로고침
복원)를 검증한다.

신규 파일: `e2e/fixtures/extension.ts`, `e2e/fixtures/mock-problem.html`,
`e2e/widget-drag-move.spec.ts`

### 완료 조건 (Acceptance Criteria)
- [ ] `pnpm test:e2e`로 실제 Chrome에 확장이 로드되고, mock 문제 페이지에서 Codit 위젯이 뜬다
- [ ] 헤더를 드래그해 위치를 옮기면 위젯이 그 위치로 이동한다
- [ ] 페이지를 새로고침하면 옮긴 위치 그대로 복원된다(기본 위치 아님)
- [ ] 테스트 실행 후 남는 시스템 흔적 없음(temp userDataDir만 사용, hosts 파일 등 미변경)

### 시나리오

**시나리오 A — 헤더 드래그 후 새로고침해도 위치 유지**

**Given** mock 문제 페이지에서 위젯이 기본 위치(top-right)에 expanded로 떠 있다.
**When** 헤더를 드래그해 좌하단 쪽으로 옮긴다.
**Then** 위젯이 그 위치로 이동한다.
**When** 페이지를 새로고침한다.
**Then** 위젯이 새로고침 전 옮긴 위치에서 다시 뜬다.

---

## Issue 2: [e2e-infra] 접힌 pill 드래그·클릭 구분 검증

### 설명
Issue 1의 인프라를 그대로 사용. 위젯을 collapsed(pill) 상태로 만든 뒤, 5px
미만 pointer 이동(클릭)과 5px 이상 이동(드래그)이 실제 브라우저에서 서로
다른 결과를 내는지 검증한다.

의존: Issue 1

### 완료 조건 (Acceptance Criteria)
- [ ] pill을 살짝 눌렀다 떼면(5px 미만) 위젯이 펼쳐진다
- [ ] pill을 5px 이상 드래그하면 위젯이 이동하고 펼쳐지지 않는다

### 시나리오

**시나리오 B — pill 클릭 vs 드래그**

**Given** 위젯이 collapsed 상태다.
**When** pill을 3px만 이동 후 뗀다.
**Then** 위젯이 펼쳐진다.
**When** (다시 collapsed 상태에서) pill을 20px 드래그한다.
**Then** 위젯이 이동하고, 펼쳐지지 않는다.

---

## Issue 3: [e2e-infra] 다중 탭 storage 동기화 검증

### 설명
Issue 1의 인프라를 그대로 사용. 같은 persistent context 안에서 탭(page)
두 개를 열어, 한 탭에서 옮긴 위치가 다른 탭에도 반영되는지
(`storage.onChanged`) 검증한다.

의존: Issue 1

### 완료 조건 (Acceptance Criteria)
- [ ] 같은 mock 문제 페이지를 탭 A, 탭 B에서 연다
- [ ] 탭 A에서 위젯을 드래그해 위치를 옮기면, 탭 B의 위젯도 같은 위치로 이동한다

### 시나리오

**시나리오 C — 다중 탭 동기화**

**Given** 탭 A, 탭 B에 같은 mock 문제 페이지가 열려 있다.
**When** 탭 A에서 위젯을 드래그해 옮긴다.
**Then** 탭 B의 위젯 위치도 동일하게 갱신된다.
