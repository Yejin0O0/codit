# Timer Session Continuity (풀이 타이머 세션 연속성) 요구사항

## 개요

SWEA 문제를 풀던 도중 페이지를 새로고침하거나, 같은 문제의 다른 SWEA 페이지로
이동하거나, 위젯을 접었다 펴면 Codit 풀이 타이머가 끊긴다. SWEA 문제 페이지는 코드
제출·예제 실행 등으로 페이지 이동/새로고침이 잦다.

이 feature 의 목표는 **세 가지 Timer 연속성**이다.

1. **새로고침 후 Timer Session continuity** — 새로고침해도 진행 중이던 타이머가 이어진다.
2. **SWEA 문제 페이지 간 continuity** — `problemDetail.do` ↔ `solvingProblem.do` 등
   같은 문제(`contestProbId`)의 다른 페이지로 옮겨도 같은 타이머가 이어진다.
3. **Widget expanded ↔ collapsed 간 Timer continuity** — 위젯을 접었다 펴도 타이머의
   진행/정지 상태가 끊기지 않는다.

저장 대상은 타이머 연속성에 필요한 최소 정보(문제 식별자, 시작 시각, 완료 상태)로
한정하며, 결과/메모/태그/화면·위젯 접힘 여부 등은 저장하지 않는다.

- Primary user: SWEA에서 문제를 풀며 Codit 타이머를 사용하는 사용자 본인.
- 백엔드 불필요 — 브라우저 로컬(세션 범위)에서 완결된다.
- 새로고침·탭 이동·같은 문제 재진입은 복원되고, 브라우저 완전 종료 시에는 삭제된다.

## Scope 결정 기록 (사용자 결정)

최초 아이디어에는 Widget 접기/펼치기, 접힌 상태에서도 경과 시간 표시, 접어도 Timer
가 계속 이어짐이 포함되어 있었다.

**Widget Collapse 는 이번 Feature (`timer-persistence`) 범위에 포함한다.**
(초기에 별도 후속 Feature 로 분리하는 안을 검토했으나 되돌림.)

단 책임은 분리한다:

- `TimerSession = { problemId, startedAt, status, stoppedAt }` — 저장 대상.
- `WidgetViewState = expanded | collapsed` — 화면 표현 상태. **`TimerSession`/storage 에
  포함하지 않는다.**

상세는 아래 "Widget 표현 상태(WidgetViewState)" 및 `prd.md` ADR-5.

## 문제 식별 방법

Codit Floating Widget은 **`swexpertacademy.com` 내 지원 대상 문제 페이지에서만**
동작한다. Timer Session의 식별 기준(Session Identity)은 URL 자체가 아니라
**`contestProbId`** 이다.

### contestProbId 획득 우선순위

1. URL 쿼리 스트링의 `?contestProbId=` 값
   (`problemDetail.do`, `solvingClub/.../problemView.do` 등)
2. 없으면 DOM에서 `#contestProbId` 또는 `input[name="contestProbId"]` 의 `value`
   (`solvingProblem.do` 등 URL에 문제 식별자가 없는 페이지)
3. 둘 다 없으면 **Widget을 표시하지 않는다.**

### 규칙

- `problemDetail.do` 와 `solvingProblem.do` 에서 **동일한 `contestProbId`** 가
  확인되면 **같은 Timer Session** 으로 취급한다.
- `solvingProblem.do` 는 **문제마다 URL이 동일하다** (query string 없음).
  따라서 URL을 Session Identity로 사용하지 않는다.
- hidden input(`#contestProbId`)이 페이지 로드 초기 시점에는 아직 존재하지 않을 수
  있다. 이 경우 **즉시 영구 실패로 처리하지 않는다.** 이후 식별자가 나타나면
  Widget을 표시한다. (구체적인 대기·감지 방식은 단계 2 아키텍처에서 결정한다.)
- 동일한 `solvingProblem.do` URL에서도 `contestProbId` 값이 바뀌면 **다른 문제**로
  판단한다. 이때 **기존 문제의 Timer Session은 삭제하지 않고 보존한다**(시나리오 C).
- 로그인 페이지, 문제 식별이 불가능한 페이지에서는 Widget을 표시하지 않으며
  SWEA 사용을 방해하지 않는다.
- **로그인 여부 자체는 Session Identity가 아니다.** 로그인 성공 후 지원 대상 문제
  페이지가 로드되면 다시 문제 식별을 수행한다.

### 지원 대상 / 범위 밖 SWEA 경로

| 경로 | contestProbId 위치 | 지원 |
|---|---|---|
| `problemDetail.do` | URL `?contestProbId=` | ✅ |
| `solvingClub/.../problemView.do` | URL `?contestProbId=` | ✅ |
| `solvingProblem/solvingProblem.do` | DOM `#contestProbId` hidden input | ✅ |
| 모의 테스트 / Contest Problem / User Problem / Code Battle | — | ❌ Out of Scope |

### 근거와 한계

- `solvingProblem.do` 의 식별자 위치(`input#contestProbId`)와 "모든 문제가 동일
  URL·query string 없음"은 오픈소스 SWEA 익스텐션 3종(BaekjoonHub, SolveSync,
  algo-plus)의 실제 구현과 SolveSync의 날짜 기입 현장 관찰(2026-08-25 등)로
  교차 확인된 값이다. 현재 요구사항·설계의 **기본 가정**으로 채택한다.
- 단, **실제 로그인 상태의 `solvingProblem.do` DOM을 직접 확인하지는 못했다**
  (인증 세션 없음, 비로그인 시 로그인 페이지로 redirect). 구현 착수 전에 아래
  "구현 전 검증 항목"을 반드시 1회 수행한다.

## Widget 표현 상태 (WidgetViewState)

`WidgetViewState` 는 `expanded | collapsed` 두 값을 가지며, **Timer 측정과는 별개의
화면 표현 상태**다.

- 기본값은 `expanded`. 새 document 에서 위젯은 항상 `expanded` 로 시작한다.
- **collapsed 상태 자체는 새로고침 후 복원하지 않는다.** (`TimerSession`/storage 에
  넣지 않음.)
- **접기/펼치기는 Timer 의 시작·완료·종료·초기화에 영향을 주지 않는다.**
- **collapsed 상태에서도 running Timer 는 계속 증가해 표시**된다.
- **stopped Timer 라면 collapsed 상태에서도 고정된 최종 시간을 표시**한다.
- **collapse 후 다시 expand 하면** 접기 직전의 App workflow 상태(현재 화면·입력 중이던
  값 등, in-memory)로 그대로 돌아간다.
- 위젯 접힘/펼침 선호를 저장하는 것(다음 방문에도 접힌 채로)은 이번 feature 범위 밖.

## 사용자 시나리오

### 시나리오 A — 새로고침 후 타이머 이어짐

**Given** 사용자가 문제 X의 타이머 화면에서 5분째 풀이 중이다.
**When** 페이지를 새로고침한다.
**Then** 타이머 화면이 다시 뜨고, 타이머는 0이 아니라 실제 경과 시간(약 5분 몇 초)부터
계속 흐른다.

### 시나리오 B — 완료 후 새로고침

**Given** 사용자가 "완료"를 눌러 타이머를 멈췄고 결과 선택 화면에 있다(측정 시간 7분 30초).
**When** 페이지를 새로고침한다.
**Then** 측정된 풀이 시간(7분 30초)은 그대로 유지되며 결과 선택 화면으로 진입한다.
타이머는 다시 흐르지 않는다. 결과/메모/태그는 저장하지 않으므로 처음부터 다시 입력한다.

### 시나리오 C — 다른 문제로 이동

**Given** 사용자가 문제 X를 3분째 풀이 중이다.
**When** 브라우저에서 문제 Y의 페이지로 이동한다(SWEA는 문제 전환 시 새 document를
load하므로 content script가 문제 Y의 `contestProbId`로 다시 실행된다).
**Then** 문제 Y는 0초부터 새 타이머(새 세션)로 시작한다. 문제 X의 세션은 삭제되지 않고
그대로 보존된다. 이후 사용자가 문제 X로 돌아오면 X의 세션이 복원되며, 경과 시간은
벽시계 기준으로 계산된다(= X를 떠나 있던 시간도 포함된다. 일시정지하지 않는다).

### 시나리오 D — 같은 문제의 다른 SWEA 페이지로 이동

**Given** 사용자가 `problemDetail.do?contestProbId=X` 에서 X를 4분째 풀이 중이다.
**When** "문제 풀기"로 `solvingProblem.do`(URL에 X 없음, hidden input에 X)로 이동한다.
**Then** 두 페이지에서 확인된 `contestProbId` 가 같으므로 **동일 세션**이 유지된다.
타이머는 4분 몇 초부터 계속 흐른다(페이지가 달라도 새 세션을 만들지 않는다).

### 시나리오 E — 같은 문제를 여러 탭/창에서

**Given** 탭 A에서 문제 X를 5분째 풀이 중이다.
**When** 새 탭/창에서 같은 문제 X 페이지를 연다.
**Then** 새 탭의 위젯도 같은 세션을 읽어 약 5분부터 이어서 표시한다(한 문제 = 하나의
풀이 세션, 탭 간 공유).

### 시나리오 F — collapsed 상태에서도 타이머 계속

**Given** 사용자가 문제 X를 3분째 풀이 중이다(타이머 화면, running).
**When** 위젯을 접는다(collapsed).
**Then** 접힌 뷰에 경과 시간이 계속 증가하며 표시된다. 타이머는 멈추지 않는다.
다시 펴면 타이머 화면으로 돌아가 이어서 흐른다.

### 시나리오 G — 완료 후 collapse/expand 왕복

**Given** 사용자가 "완료"를 눌러 타이머를 멈췄고(측정 5분 고정) 결과 선택 화면에서
결과를 고르는 중이다.
**When** 위젯을 접었다가 다시 편다.
**Then** 결과 선택 화면으로 그대로 돌아가고, 고르던 값도 유지된다. 5분은 고정 표시되며
접힌 동안에도 다시 흐르지 않았다.

### 시나리오 H — collapsed 상태에서 새로고침

**Given** 사용자가 위젯을 접은 상태에서 문제 X를 5분째 풀이 중이다.
**When** 페이지를 새로고침한다.
**Then** 타이머는 이어진다(시나리오 A). 단 위젯은 다시 **`expanded`** 로 뜬다
(collapsed 상태는 복원하지 않는다).

## 경계 조건 및 엣지 케이스

| 상황 | 처리 |
|---|---|
| 세션 식별 | `contestProbId` 값으로만 식별한다. SWEA URL 경로·query string 은 Session Identity가 아니다. |
| `solvingProblem.do` 처럼 URL이 문제마다 동일한 페이지 | hidden input(`#contestProbId`)의 값을 세션 키로 사용한다. |
| 동일 URL에서 `contestProbId` 값만 바뀜 | 다른 문제로 판단. 새 세션 시작, 기존 문제 세션은 보존. |
| hidden input이 아직 렌더되지 않음 | 즉시 실패로 처리하지 않는다. 이후 나타나면 Widget 표시. |
| 로그인 페이지로 redirect / 식별 불가 페이지 | Widget 미표시, SWEA 사용 방해 없음. 로그인 후 문제 페이지 로드 시 재식별. |
| 다른 문제로 이동 시 기존 세션 | 삭제하지 않고 보존한다(시나리오 C). |
| 문제를 떠나 있는 동안의 시간 | 별도 처리 없음 — 벽시계로 계속 흐른 것으로 본다(pause/resume 없음). |
| 완료("완료" 클릭) 후 새로고침 | `status: stopped` 로 복원. 경과 시간은 `stoppedAt - startedAt` 으로 고정 표시(시나리오 B). |
| success 화면 도달 | 해당 문제의 세션을 삭제한다. **이 feature에서 세션 삭제는 이 경우로만 한정한다.** |
| 중도 포기 / 뒤로가기 / 흐름 이탈 | 이번 스펙에서는 세션 삭제 조건으로 정의하지 않는다(Out of Scope). 세션은 남아 있다가 재진입 시 복원되거나 브라우저 종료 시 삭제된다. |
| 저장된 값이 손상 / 스키마 불일치 / `startedAt` 이 미래·음수 등 비정상 | 무시하고 새 세션(0초, 타이머 화면)으로 시작한다. |
| `stoppedAt < startedAt` 등 모순된 값 | 비정상으로 간주, 무시하고 새 세션. |
| 브라우저 완전 종료 후 재시작 | 세션이 남아 있지 않다(세션 범위 저장). 새 타이머로 시작한다. |
| 여러 문제를 동시에 진행 | 각 `contestProbId` 별로 독립된 세션이 존재한다. |
| 위젯 접기/펼치기 | `WidgetViewState` 만 바뀐다. `TimerSession`·`useTimer`·화면 상태는 불변. Timer 시작/완료/종료/초기화 없음. |
| collapsed 상태에서 running / stopped | running 이면 접힌 뷰에서 경과 시간이 계속 증가, stopped 이면 고정된 최종 시간 표시. |
| 새로고침 시 접힘 여부 | 복원하지 않는다. 새 document 는 항상 `expanded`. |
| collapse 후 expand | 접기 직전의 App workflow 상태(화면·입력값, in-memory)로 그대로 복귀. |

## 에러 처리 방식

핵심 원칙: **persistence 실패나 문제 식별 실패가 SWEA 사용이나 타이머 자체의
동작을 절대 방해하지 않는다.**

| 상황 | 동작 |
|---|---|
| 문제 식별 불가(URL·DOM 모두 없음) | Widget 미표시. SWEA 화면 무수정. |
| 저장된 세션 읽기 실패 / 값 손상 / 스키마 불일치 | 무시하고 새 세션으로 시작한다. |
| 세션 저장(write) 실패 (quota, 권한 등) | 조용히 무시한다. 타이머는 메모리에서 계속 동작하며, 이번 새로고침에서만 복원되지 않는다. `console.warn` 수준의 기록만 남긴다. |
| `chrome.storage` API 자체 미가용 | persistence 없이 기존처럼 동작한다(graceful degradation). |

사용자에게 보이는 에러 메시지 · alert · 배지는 **없다.** 복원되면 그냥 이어지고,
안 되면 그냥 0부터 시작한다 — 어느 쪽이든 조용히 처리한다.

복원 시 별도의 안내 문구("이어서 측정 중" 등)도 표시하지 않는다.

## 구현 전 검증 항목

구현 착수 전에 **로그인된 SWEA 풀이 페이지(`solvingProblem.do`)에서 1회** 다음을
직접 확인한다. 값이 예상과 다르면 단계 2 아키텍처 결정을 재검토한다.

1. 주 경로 — hidden input 존재·값 확인:

   ```js
   document.querySelector('input#contestProbId')?.value
   ```

2. fallback 경로 — id/name 셀렉터 모두, 빈 값 제외:

   ```js
   [...document.querySelectorAll('#contestProbId, input[name="contestProbId"]')]
     .map((el) => el.value)
     .filter(Boolean)
   ```

3. 부가 확인(선택): 위 값이 같은 문제의 `problemDetail.do?contestProbId=` 값과
   일치하는가. `solvingProblem.do` URL에 `?contestProbId=` 가 정말 없는가.
   같은 창에서 다른 문제를 열었을 때 `#contestProbId` 값이 바뀌는가.

## Out of Scope (초안)

- 결과 / 메모 / 태그 / 현재 화면 등 **풀이 흐름 입력 상태의 저장·복원**
- 문제를 떠나 있는 동안 타이머를 멈추는 **pause / resume**
- **브라우저 재시작 후 복원**(디스크 영속 저장, 만료 정책)
- **cross-device 동기화**
- 백엔드 저장 / Attempt Save API(`POST /api/attempts`) 연동
- **"흐름 이탈" 시 세션 삭제** 조건 정의(중도 포기, 뒤로가기 등)
- 여러 문제를 병렬로 풀 때의 경과 시간 정확도 보정
- **pause / resume / reset** (접기/펼치기는 pause 가 아니다 — Timer 는 계속 흐른다)
- **Widget 접힘/펼침 선호의 저장** (다음 방문에도 접힌 채로 뜨기 등) — Widget preference
  persistence. `WidgetViewState` 는 `TimerSession`/storage 에 넣지 않는다.
- 타이머 UI 변경(리셋 버튼, 누적 시간 표시 등) — 단, 이번 feature 의 collapse/expand
  토글과 collapsed 시간 표시는 **범위에 포함**된다.
- 세션 목록 / 관리 화면
- **모의 테스트 / Contest Problem / User Problem / Code Battle** 등 지원 대상
  외 SWEA 경로에서의 타이머 동작

## 용어 정의

| 용어 | 정의 |
|---|---|
| **Timer Session (풀이 타이머 세션)** | 한 문제(`contestProbId`)에 대한 1회 풀이 시간 측정 단위. 개념적 필드는 `{ problemId, startedAt, status, stoppedAt }` 이며, 저장 시 스키마 버전 필드를 더한다. |
| **problemId** | 해당 문제의 `contestProbId` 값. URL 쿼리(`?contestProbId=`) 또는 DOM(`#contestProbId` / `input[name="contestProbId"]`)에서 얻으며, SWEA 페이지 경로와 무관하다. |
| **Session Identity** | Timer Session을 식별하는 기준값. 곧 `contestProbId`. URL·경로·로그인 여부는 Session Identity가 아니다. |
| **storage key** | Session Identity와 구분되는, 실제 저장소 키. `timer-session:<contestProbId>` 형태(prefix 확정). 여러 문제의 세션이 각자의 key로 공존한다. |
| **지원 대상 문제 페이지** | `swexpertacademy.com` 내에서 `contestProbId` 를 확인할 수 있는 문제 풀이 페이지(`problemDetail.do`, `solvingClub/.../problemView.do`, `solvingProblem.do`). 모의 테스트·Contest·User Problem·Code Battle 제외. |
| **WidgetViewState** | 위젯의 화면 표현 상태. `expanded` 또는 `collapsed`. Timer 측정과 무관하며 `TimerSession`/storage 에 포함하지 않는다. 기본값 `expanded`, 새 document 마다 `expanded`. |
| **expanded** | 위젯이 펼쳐져 App workflow(타이머/결과/메모/태그/완료 화면)를 전부 보여주는 상태. |
| **collapsed** | 위젯이 접혀 경과 시간(running 이면 증가, stopped 이면 고정)만 최소로 보여주는 상태. |
| **status** | `running`(측정 중) 또는 `stopped`("완료" 클릭 후). |
| **startedAt** | 타이머가 시작된 시각(epoch ms). |
| **stoppedAt** | `status`가 `stopped`가 된 시각(epoch ms). `running`이면 `null`. |
| **경과 시간** | `floor((기준시각 - startedAt) / 1000)` 초. 기준시각은 `status`가 `stopped`면 `stoppedAt`, `running`이면 현재 시각. 경과 시간을 별도 값으로 저장하지 않고 항상 이렇게 계산한다. |
| **세션 생성** | 문제 페이지에서 진행 중인 세션이 없어 타이머가 새로 시작될 때 새 Timer Session을 저장하는 것. |
| **세션 완료** | "완료" 클릭 시 `status`를 `stopped`로, `stoppedAt`을 현재 시각으로 갱신하는 것. |
| **세션 종료** | success 화면 도달 시 해당 문제의 Timer Session을 삭제하는 것. |
| **복원** | 새로 mount된 content script 인스턴스가 저장된 Timer Session을 읽어, 0이 아니라 이어지는 상태로 타이머를 표시하는 것. |
| **Adapter (향후)** | Timer Session 상태를 이후 Attempt 저장 기능에서 API 입력으로 변환하는 지점. Backend DTO와의 구체 매핑은 Attempt API 계약 확정 시 결정하며, 이 feature는 그 계약에 의존하거나 미리 맞추지 않는다. |
