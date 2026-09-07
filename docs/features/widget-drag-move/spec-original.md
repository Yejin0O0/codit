# widget-drag-move — 초기 아이디어

## 배경

Codit 플로팅 위젯은 현재 SWEA 문제 페이지의 **top-right(20px/20px) 에 고정**되어 있다
(`mount.tsx` 의 `#codit-root` — `position: fixed; top: 20px; right: 20px`). expanded 패널이든
collapsed pill 이든 위치를 바꿀 수 없다.

실사용 중 다음 불편이 확인됐다:

- 위젯이 SWEA 화면의 특정 영역(문제 지문, 에디터 툴바 등)을 가릴 수 있는데 피할 방법이 없다.
- 사용자마다 선호하는 위치가 다르다.

## 하고 싶은 것

**위젯(expanded 패널 / collapsed pill 모두)을 마우스 드래그로 화면 안에서 옮길 수 있게 한다.**

- 현재 논의에서 나온 방향:
  - expanded 상태에서도, collapsed 상태에서도 이동 가능해야 한다.
  - expanded ↔ collapsed 를 오갈 때 위치가 튀지 않아야 한다(같은 위치를 공유).

## 미정 (인터뷰에서 확정할 것)

- 위치를 저장하는가? (세션 중만 / 새로고침 후에도 / 안 함)
- 저장한다면 어디에? (`chrome.storage.local` / `session` / 백엔드)
- 드래그 핸들: expanded 는 헤더, collapsed pill 은 pill 자체? pill 클릭(펼치기)과 드래그를 어떻게 구분?
- 화면 경계 밖으로 못 나가게 제한(clamp)하는가? 창 리사이즈 시 재조정?
- 키보드로도 이동 가능해야 하는가(WCAG 2.5.7 드래그 대안)?
- 기본 위치는 유지(top-right 20/20)하고, 사용자가 옮긴 뒤에만 커스텀 위치를 쓰는가?

## 관련 문서 / 코드

- `docs/features/timer-persistence/ui-design.md` — Out of Scope 에 이 feature 가 별도 분리 명시됨
- `docs/features/timer-persistence/prd.md` — ADR-5(WidgetViewState 는 storage 미포함)
- `apps/extension/entrypoints/content/mount.tsx` — `#codit-root` 컨테이너 positioning
- `apps/extension/entrypoints/content/App.tsx` — `viewState`(expanded|collapsed) 소유
- `apps/extension/components/codit/panel-shell.tsx` — expanded 패널 헤더
- `apps/extension/entrypoints/content/collapsed-timer.tsx` — collapsed pill

## 선행 조건

- timer-persistence Issue #15(위젯 접기/펼치기) = PR #18. 이 feature 는 #18 머지 후 착수 권장
  (같은 파일 다수 수정).
