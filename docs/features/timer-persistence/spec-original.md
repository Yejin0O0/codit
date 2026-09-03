# timer-persistence 초기 아이디어

## 문제

브라우저를 새로고침하면 풀이 타이머가 초기화된다.

현재 `useTimer`(`apps/extension/entrypoints/content/useTimer.ts`)는 content script가
mount될 때 `Date.now()`를 시작 시각으로 잡고 경과 시간을 계산한다. 새로고침하면
content script 인스턴스가 새로 뜨면서 시작 시각도 다시 잡히고, `App`의 화면 상태도
`'timer'`로 되돌아간다. 즉 실제로 문제를 풀던 도중 새로고침 한 번에 측정값이
사라진다.

SWEA 문제 페이지는 코드 제출·예제 실행 등으로 페이지 이동/새로고침이 잦기 때문에
실사용에서 자주 발생하는 문제다.

## 원하는 것

새로고침해도, SWEA 문제 페이지를 옮겨 다녀도, 위젯을 접었다 펴도 진행 중이던 풀이
타이머가 끊기지 않고 이어져야 한다.

최초 아이디어에는 Widget 자체에 대한 요구도 함께 있었다:

- Floating Widget 접기 / 펼치기
- 접힌 상태에서도 경과 시간 표시
- 접어도 Timer 는 계속 이어짐

## Scope 결정 (2026-09 사용자 결정)

Widget Collapse(접기/펼치기 + collapsed 상태 시간 표시)는 **이번 Feature
(`timer-persistence`) 범위에 포함**한다. (초기에 별도 후속 Feature 로 분리하는 안을
검토했으나 되돌림.)

이번 Feature 의 목표 = **세 가지 Timer 연속성**:

1. 새로고침 후 Timer Session continuity
2. `problemDetail.do` ↔ `solvingProblem.do` 등 SWEA 문제 페이지 간 continuity
3. Widget expanded ↔ collapsed 간 Timer continuity

단, 저장 대상인 `TimerSession` 과 화면 표현인 `WidgetViewState(expanded | collapsed)`
는 책임을 분리한다(상세는 `spec-fixed.md` / `prd.md` ADR-5).

## 관련 히스토리

- handoff 문서(`docs/handoff/frontend-handoff.md`) §8에서 timer persistence
  (chrome.storage / background timer / multi-tab 동기화 / reload 복원 /
  browser restart 복원)를 "이번 범위 밖 후속"으로 명시해 미뤄둔 항목.
- 직전 작업(`f383399`)에서 `useTimer`를 벽시계(Date.now) 기준으로 바꿔
  "화면이 열린 동안의" 정확도만 개선했고, 영속성은 다루지 않았다.
