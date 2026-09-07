# E2E 인프라 + widget-drag-move 핵심 플로우 검증 요구사항

## 개요

`playwright.config.ts`는 존재하지만 `e2e/` 디렉터리가 비어 있어 실제로
동작하는 E2E 테스트가 전무하다. Vitest 단위 테스트(jsdom)로는 검증할 수
없는 것들 — 실제 브라우저에서의 Chrome 확장 로드, `chrome.storage.local`
실동작, 실제 pointer 좌표 기반 드래그, 다중 탭 동기화 — 를 Playwright로
검증할 수 있는 인프라를 구축하고, widget-drag-move(#19~#21) 핵심 플로우
3개를 그 위에서 검증한다.

widget-drag-move 기획 시점(`docs/features/widget-drag-move/issue-19.md`)에
"#19~#21 각각 따로 안 짜고 feature 완성 시점에 전용 E2E 인프라와 함께
구축한다"고 이미 결정했다. PR #25로 `develop`에 #19~#21이 전부 머지 완료된
지금이 그 시점이다.

- Primary user: 이 저장소에서 작업하는 개발자(FE 팀) 본인. 최종 사용자에게
  노출되는 기능이 아니라 회귀 방지를 위한 테스트 인프라다.
- 백엔드 불필요 — 확장 프로그램 자체와 mock HTML 페이지만으로 완결된다.

## 사용자 시나리오 (커버 범위 — 핵심 플로우 3개)

### 시나리오 A — 헤더 드래그 → 위치 저장 → 새로고침 복원

**Given** mock 문제 페이지에서 위젯이 expanded 상태로 떠 있다.
**When** 헤더를 드래그해 다른 위치로 옮긴다.
**Then** 위젯이 그 위치로 이동하고, 페이지를 새로고침하면 옮긴 위치 그대로
복원된다(기본 위치가 아니라).

### 시나리오 B — 접힌 pill 드래그 vs 클릭 구분

**Given** 위젯이 collapsed(pill) 상태다.
**When** pill을 5px 미만으로 살짝 눌렀다 떼면(클릭) 위젯이 펼쳐진다.
**When** pill을 5px 이상 드래그하면 위젯이 이동하고 펼쳐지지 않는다.
**Then** 두 제스처가 서로 다른 결과를 낸다.

### 시나리오 C — 다중 탭 storage 동기화

**Given** 같은 mock 문제 페이지를 탭 두 개에서 연다.
**When** 탭 A에서 위젯을 드래그해 위치를 옮긴다.
**Then** 탭 B의 위젯도 (storage.onChanged 를 통해) 같은 위치로 이동한다.

## 경계 조건 및 엣지 케이스

- 이번 이슈는 핵심 플로우 3개로 범위를 한정한다. storage 실패 fail-soft,
  뷰포트 가장자리 clamp 등 엣지 케이스는 Out of Scope(아래 참고).
- mock 페이지는 SWEA `problemDetail.do`의 최소 재현본
  (`?contestProbId=` 쿼리 포함 HTML)으로, 로컬 정적 파일로 서빙한다.

## 에러 처리 방식

- E2E 테스트 자체의 실패는 Playwright 리포터(`reporter: 'list'`, 이미
  설정됨)로 표준 출력에 드러난다. 별도 알림 체계는 만들지 않는다.
- 테스트 인프라 자체(확장 로드 실패 등)가 깨지면 즉시 실패해야 한다 —
  조용히 skip 처리하지 않는다.

## Out of Scope

- 실제 `swexpertacademy.com` 페이지 접근 (mock HTML로 대체)
- CI(GitHub Actions) 통합 — 이번 이슈는 로컬 실행 전용
- widget-drag-move의 엣지 케이스 E2E (storage 실패 fail-soft, 가장자리
  clamp, `consumeDragEnd` 타이밍 등) — 핵심 플로우 3개 밖의 시나리오
- timer-persistence(#15~#18) 등 다른 기능의 E2E — 이번 이슈는
  widget-drag-move 범위로 한정
- 로그인 플로우, 문제 식별 실패 등 다른 content-script 진입 조건

## 용어 정의

| 용어 | 정의 |
|---|---|
| **E2E 인프라** | Playwright가 실제 Chrome 브라우저에 빌드된 확장 프로그램을 로드해 테스트를 구동할 수 있게 하는 설정(persistent context, 확장 로드 방식, mock 페이지 서빙). |
| **Mock 문제 페이지** | SWEA `problemDetail.do`를 최소 재현한 로컬 정적 HTML. `contestProbId` 쿼리 스트링을 포함해 content script가 위젯을 mount하도록 한다. |
| **핵심 플로우** | 이번 이슈에서 커버하는 시나리오 A/B/C — 헤더 드래그+영속, pill 드래그·클릭 구분, 다중 탭 동기화. |
