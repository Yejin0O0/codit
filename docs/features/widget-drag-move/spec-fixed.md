# widget-drag-move 요구사항

> 단계 1(요구사항 인터뷰) 산출물. 확정 후 단계 2(PRD + ADR)로 진행.
> 선행: timer-persistence Issue #15 (PR #18) 머지 후 착수 — `mount.tsx`·`App.tsx`·
> `panel-shell.tsx`·`collapsed-timer.tsx` 를 다수 수정하므로.

## 개요

Codit 플로팅 위젯(expanded 패널 / collapsed pill 모두)을 **마우스 드래그로 화면 안에서
이동**시킬 수 있게 한다. 현재는 `#codit-root` 가 `position: fixed; top: 20px; right: 20px`
로 고정되어 위치를 바꿀 수 없다.

- **동기**: (1) 위젯이 SWEA 화면의 특정 영역(문제 지문·에디터 툴바 등)을 가리는 것을 피하고,
  (2) 사용자가 선호하는 위치에 둔다.
- **대상 입력**: 데스크톱 마우스 드래그 전용. Chrome 데스크톱 확장이므로 터치는 비대상
  (pointer 이벤트로 구현하되 터치 UX 는 별도로 검증하지 않는다).
- **이동된 위치는 저장**되어 새로고침·브라우저 재시작 후에도 유지된다.

## 사용자 시나리오

### A. expanded 패널 이동
사용자가 풀이 화면에서 **PanelShell 헤더**를 마우스로 누른 채 드래그하면 위젯이 커서를
따라 이동하고, 버튼을 놓으면 그 위치에 고정된다.

### B. collapsed pill 이동
사용자가 접힌 pill 을 드래그하면 pill 이 이동하고 놓으면 고정된다.
pill 을 **짧게 클릭**(포인터 이동 < 5px)하면 기존대로 펼쳐진다 — 드래그와 클릭을 구분한다.

### C. 상태 전환 시 위치 유지
B 에서 옮긴 뒤 pill 을 클릭해 펼치면 expanded 패널이 **옮긴 위치**에 나타난다
(top-right 로 튀지 않는다). 접기도 동일하게 마지막 위치를 유지한다.
expanded ↔ collapsed 는 **같은 Widget Position 을 공유**한다.

### D. 새로고침 후 위치 유지
위젯을 옮긴 뒤 페이지를 새로고침하거나 브라우저를 다시 열어도 위젯은 **옮긴 위치에
그대로** 나타난다. (저장 = `chrome.storage.local`)

## 경계 조건 및 엣지 케이스

| 상황 | 처리 |
|---|---|
| 화면 밖으로 드래그 | 위젯 **전체가 뷰포트 안에 남도록 clamp**. 커서는 밖으로 나가도 위젯은 가장자리에서 멈춤 |
| 창 리사이즈 / 저장된 위치가 현재 화면 밖 | mount 시 + `resize` 시 저장값을 현재 뷰포트에 맞춰 **재clamp**. 저장값 자체는 보존, 표시만 보정 |
| 드래그 vs 클릭 구분 (pill 전용) | 포인터 이동 거리 **< 5px = 클릭(펼치기)**, ≥ 5px = 드래그. `pointerup` 시점 판정. 임계값은 구현 중 조정 가능 |
| expanded ↔ collapsed 크기 차이 | collapsed pill 을 가장자리에 붙였다가 펼치면 넓은 패널이 밖으로 나갈 수 있음 → **펼칠 때도 clamp** |
| 저장값 손상 / 구버전 (`{top,left}` 아님, NaN 등) | 무시하고 **Default position(top-right 20/20)** 폴백. 잘못된 값은 다음 저장 때 덮어씀 |
| 여러 SWEA 탭 동시 열림 | `storage.onChanged` 구독 → 한 탭에서 옮기면 **다른 탭 위젯도 같은 위치로 실시간 이동** |
| 드래그 중 텍스트 선택 / 이벤트 누수 | 드래그 시작 시 `user-select: none` + pointer capture 로 SWEA 페이지에 selection·이벤트 누수 방지 |
| mount 시 위치 깜빡임 | `storage.local.get` 완료 전까지 위젯 **비표시**, 위치 확정 후 첫 페인트 (깜빡임 0) |

**드래그 조작 방식 (확정)**:
- collapsed pill = pill 아무 곳이나 눌러 드래그. 5px 임계값으로 클릭(펼치기)과 구분.
- expanded 패널 = **헤더**가 드래그 핸들 (OS 창 타이틀바와 동일). 접기 버튼·본문·푸터는 드래그 대상 아님.
- 드래그 가능 영역 hover 시 `cursor: grab`, 드래그 중 `cursor: grabbing`. (추가 아이콘 없음)

## 에러 처리 방식

**원칙: 이동은 절대 실패하지 않는다(로컬 상태). 저장 실패는 조용히 삼킨다(fail-soft). 에러 UI 없음.**

| 실패 상황 | 처리 |
|---|---|
| `storage.local` 쓰기 실패 (quota, API 에러, `Extension context invalidated`) | 조용히 무시. 위젯은 드래그한 위치에 그대로(인메모리 유지). 다음 이동 시 재시도. `console.warn` 1줄 |
| `storage.local` 읽기 실패 (mount 시) | Default position 폴백 (손상값 케이스와 동일) |
| `storage.onChanged` 구독/동기 실패 | 그 순간 다른 탭 동기만 안 됨. 각 탭은 자기 인메모리 위치로 정상 동작. 알림 없음 |
| 확장 리로드/업데이트 중 content script 생존 | `chrome.*` 호출 throw → try/catch 로 "저장 불가" 취급, 위젯은 계속 드래그 가능 |

에러 토스트·모달·배너 없음. SWEA 문제 풀이를 방해하지 않는다.

## Out of Scope (초안)

- 패널 **크기 조절(resize)** — 드래그 인프라는 재사용 가능하게 두되 이번엔 안 함
- 화면 **가장자리 스냅 / 도킹**
- **크로스 디바이스 위치 동기** (백엔드 저장) — 저장 계층은 훅으로 캡슐화해 여지만 남김
- **문제별 / 페이지별 위치 저장** — Widget Position 은 전역 1개
- 터치 제스처 전용 UX 검증
- 드래그 **관성(inertia) / 애니메이션** 효과
- 위젯 크기·투명도 등 기타 외형 커스터마이징
- **popup / sidepanel 위치 이동** — 브라우저 chrome 관할, 대상 아님
- 다중 모니터 간 이동 (브라우저 창 범위 내로 제한)
- **"기본 위치로 초기화" 버튼** — 단계 2-4 에서 포함 여부 재판단 (작은 추가라 넣을 수도)

## 용어 정의 (Ubiquitous Language)

| 용어 | 정의 |
|---|---|
| **Widget** | Codit 플로팅 UI 전체 (`#codit-root` + Shadow DOM). `expanded` / `collapsed` 상태를 가짐 |
| **Widget Position** | 위젯의 화면 내 위치. `{ top, left }` px, **뷰포트 좌상단 기준**. 전역 1개. `expanded`/`collapsed` 공유 |
| **Default position** | 저장값이 없을 때의 위치. 현재 top-right (`top: 20`, `right: 20`) 동작을 유지 |
| **Drag handle** | 드래그를 시작할 수 있는 영역. `expanded` = PanelShell 헤더, `collapsed` = pill 전체 |
| **Drag threshold** | 클릭과 드래그를 구분하는 포인터 이동 거리 (기본 5px) |
| **Clamp** | 위젯이 뷰포트 밖으로 나가지 않도록 위치를 경계 안으로 보정하는 것 |
| **`#codit-root`** | content script 가 만드는 `position: fixed` 컨테이너 (`mount.tsx`). Shadow DOM 밖에 있으며, **실제로 이동되는 DOM 요소** |
| **`useWidgetPosition`** | (가칭) Widget Position 상태 + `storage.local` 동기 + clamp + `onChanged` 구독을 담는 훅. 저장 계층을 캡슐화 |

## 기술 메모 (단계 2 아키텍처에서 확정)

- **위치 state 소유 주체** — `App`(viewState 처럼) vs 전용 훅 vs `mount.tsx` 레벨. 3안 비교 대상.
- **`#codit-root` 조작 경로** — App 은 Shadow DOM 안, `#codit-root` 는 밖. `mount.tsx` 가
  ref/콜백을 `<App>` 에 주입 vs App 이 `document.getElementById('codit-root')` 직접 접근 vs
  positioning 을 `mount.tsx` 레벨에서 관리. 3안 비교 대상.
- **positioning 전환** — `top/right` 고정 → `top/left` + (드래그 중) `transform: translate3d`.
- `"storage"` manifest permission 신규 (`wxt.config.ts`).
- 착수 순서 — #15(PR #18) 머지 후. #16/#17 과 `mount.tsx`·`App.tsx` 를 공유하므로 순차 진행 + rebase.
