# E2E 인프라 + widget-drag-move 핵심 플로우 검증 PRD

## 1. 개요

`e2e/` 디렉터리를 새로 만들어 Playwright가 실제 Chrome에 빌드된 확장
프로그램을 로드하고, widget-drag-move(#19~#21) 핵심 플로우 3개를 실제
브라우저 동작으로 검증하는 인프라를 구축한다. 로컬 전용 실행이며,
`swexpertacademy.com`을 흉내 낸 mock HTML 페이지 위에서 테스트한다.

## 2. 사용자 스토리

- FE 개발자로서, widget-drag-move 회귀가 생기면 `pnpm test:e2e`로 로컬에서
  바로 잡아내고 싶다 — jsdom 단위 테스트가 놓치는 실제 브라우저 동작
  (storage, 다중 탭, 실제 드래그 좌표)까지.
- FE 개발자로서, 이후 다른 기능(timer-persistence 등)도 같은 인프라 위에
  E2E를 추가할 수 있길 원한다 — 이번 이슈가 그 기반이 된다.

## 3. 기술 결정 (ADR)

### ADR-1. Chrome 확장 로드 방식 — Playwright `launchPersistentContext` + `--load-extension`

**Context** — Playwright로 실제 Chrome 확장 프로그램(Shadow DOM, content
script, `chrome.storage.local`)을 로드해 테스트해야 한다. 3가지 안을
비교했다: (A) `launchPersistentContext` + CLI 플래그로 확장 로드,
(B) `content.js`를 일반 페이지에 직접 주입(확장 미로드),
(C) A와 동일하되 테스트 간 고정 프로필 재사용.

**Decision** — 안 A. `chromium.launchPersistentContext(userDataDir, { args:
['--disable-extensions-except=<path>', '--load-extension=<path>'] })`로 매
테스트마다 새 temp `userDataDir`를 만들어 확장을 로드한다.

**Alternatives**
- 안 B(직접 주입) 거부 — `chrome.*` API 자체가 없어 실제 storage 동작을
  검증할 수 없고, 시나리오 C(다중 탭 동기화)를 구성할 방법이 없다. 이번
  이슈의 목적(jsdom이 못 하는 실제 storage 검증)을 달성하지 못한다.
- 안 C(고정 프로필 재사용) 거부 — 이전 테스트 실행의 저장된 위치가 다음
  실행에 남아 시나리오 A(새로고침 복원)를 오염시킬 수 있다. 매 테스트
  storage clear 로직을 추가로 관리해야 해 격리가 깨진 상태를 수동으로
  보정하는 구조가 된다.

**Consequences**
- 장점: 실제 사용자 환경과 동일한 조건에서 검증되어 신뢰도가 가장 높다.
  테스트 간 완전 격리로 flaky 위험이 낮다.
- 단점: 매 테스트마다 새 브라우저 프로필을 만들어 안 C보다 느리다. 로컬
  전용 실행(Out of Scope: CI)이라 속도보다 정확성을 우선한 것과 일관된다.
- `.output/chrome-mv3`가 최신 빌드여야 하므로, `pnpm test:e2e` 실행 전
  `apps/extension` 빌드가 선행되어야 한다(스크립트 또는 문서로 안내).

### ADR-2. Mock 페이지를 `swexpertacademy.com`으로 인식시키는 방법 — `context.route` 네트워크 가로채기

**Context** — manifest의 `content_scripts.matches`가
`*://*.swexpertacademy.com/*`로 고정되어 있어(코드 수정 대상 아님, 프로덕션
보안 경계), `file://` 또는 `localhost` mock 페이지에는 content script가
자동 주입되지 않는다. 확장 코드를 건드리지 않고 실제 주입 경로를 그대로
타야 한다.

**Decision** — `context.route('https://swexpertacademy.com/**', ...)`로
해당 도메인 요청을 가로채 로컬 mock HTML(`e2e/fixtures/*.html`)로
`fulfill()`한다. 테스트는 `page.goto('https://swexpertacademy.com/main/...
?contestProbId=E2E-TEST-001')`로 이동하고, 브라우저 주소창 기준으로는 진짜
그 도메인이므로 manifest match가 정상 동작해 content script가 실제로
주입된다.

**Alternatives**
- OS `hosts` 파일에 `swexpertacademy.com`을 `127.0.0.1`로 매핑 — 거부.
  시스템 전역 설정 변경이라 다른 프로그램에도 영향, 실행 환경마다 관리
  필요, 되돌리는 것도 별도 작업이라 테스트 인프라로 부적절하다.
- 로컬 정적 서버(`localhost:PORT`)를 그대로 사용하고 manifest match를
  테스트 빌드에서만 넓히는 방식 — 거부. 프로덕션과 다른 manifest로
  테스트하게 되어 "실제 동작 검증"이라는 이번 이슈의 목적과 어긋난다.

**Consequences**
- 장점: 확장 코드·manifest를 전혀 건드리지 않고 실제 주입 경로 그대로
  검증. 브라우저 컨텍스트 범위로 완전히 격리되어 시스템에 흔적을 남기지
  않는다.
- 단점: `context.route`의 URL 패턴을 실제 SWEA 경로와 어긋나지 않게
  유지보수해야 한다(예: `problemDetail.do` 등 실제 사용 경로와 유사하게).

## 4. Out of Scope

- 실제 `swexpertacademy.com` 접근 (ADR-2로 대체)
- CI(GitHub Actions) 통합
- widget-drag-move 엣지 케이스 E2E (storage 실패 fail-soft, 가장자리 clamp 등)
- timer-persistence 등 다른 기능의 E2E
- 로그인 플로우, 문제 식별 실패 시나리오

## 5. 용어 정의

(spec-fixed.md와 동일 — E2E 인프라, Mock 문제 페이지, 핵심 플로우)
