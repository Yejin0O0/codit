# E2E 인프라 + widget-drag-move 핵심 플로우 검증 (초기 아이디어)

## 배경

`playwright.config.ts`는 저장소에 이미 존재하지만 `e2e/` 디렉터리가 비어 있어
실제로 동작하는 E2E 테스트가 하나도 없다. 지금까지의 테스트는 전부 Vitest
단위/컴포넌트 테스트(jsdom 환경)로, 다음을 검증하지 못한다.

- 실제 브라우저에서 Chrome 확장 프로그램을 로드했을 때의 동작
  (Shadow DOM 마운트, content script 주입 타이밍)
- `chrome.storage.local`의 실제 read/write/watch 동작
  (지금까지는 `fakeBrowser`로만 검증)
- 진짜 pointer 좌표·레이아웃 기반의 드래그 제스처
  (jsdom에는 실제 레이아웃이 없어 근사 시뮬레이션만 가능했음)
- 여러 탭 간 storage 동기화 (실제 탭 2개를 열어 확인한 적 없음)

widget-drag-move 기능(#19 헤더 드래그, #20 pill 드래그·클릭 구분, #21 위치
영속·다중 탭 동기)을 기획하던 시점에 이미 다음과 같이 결정해두었다
(`docs/features/widget-drag-move/issue-19.md` 등):

> widget-drag-move 는 #19/#20/#21 3개 이슈다. #19 만 단독 E2E 를 짜면
> #20(pill 드래그)·#21(영속·다중 탭)에서 재작업이 발생한다 — feature 완성
> 후 한 번에 작성하는 편이 리뷰·유지보수에 유리하다.
>
> widget-drag-move E2E 는 별도 "E2E 인프라 + 핵심 플로우" 이슈 또는 #21
> 완료 시점에 인프라와 함께 구축한다.

PR #25로 `feature/widget-drag-move`가 `develop`에 머지 완료됐고
(#19~#21 전부 포함), security-review도 완료됐다. 이제 위 결정을 실행할
시점이다.

## 하고 싶은 것 (초안)

1. Playwright가 실제 Chrome에 이 확장 프로그램을 로드해서 테스트를 구동할
   수 있도록 인프라를 구축한다 (persistent context + 빌드된 확장 로드).
2. widget-drag-move 핵심 플로우를 실제 브라우저 동작으로 검증한다:
   - 헤더 드래그로 위젯 이동 → 위치가 저장됨 → 새로고침 후 그 위치로 복원
   - 위젯을 접은(pill) 상태에서 드래그로 이동 vs 클릭으로 펼치기가 구분됨
   - 탭 두 개를 열었을 때 한쪽에서 옮긴 위치가 다른 탭에도 반영됨(storage.onChanged)

## 아직 정해지지 않은 것

- SWEA 실제 페이지에 접근할지, 목(mock) HTML 페이지로 대체할지
- 확장 프로그램 로드 방식(빌드된 `.output/chrome-mv3`를 매 테스트마다 사용할지, 캐싱할지)
- CI에서 돌릴지, 로컬 전용으로 둘지
- 몇 개의 시나리오까지 커버할지 (핵심 플로우만 vs 엣지 케이스까지)
