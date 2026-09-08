# 디자인 시스템 v1 — spec-original

> `/design-system` Phase 0 산출. 원 방향 요청을 그대로 캡처.

## 계기

`timer-persistence`(#15~#17, #37) + 팀원 로그인(#2~#4, #34, #39) 등 여러 기능이 각자
독립적으로 설계·구현되면서 화면 간 톤/디자인이 어긋남. 현재 UI는 전부 shadcn `neutral`
기본값(무채색 OKLCH) + mock. Codit만의 색·타이포·간격이 설계된 적 없음.

baseline 갤러리 스크린샷(shadcn neutral): 레이아웃은 멀쩡하나 색이 무채색이라 밋밋하고
브랜드 정체성이 없음. `--primary`가 near-black.

## 요청

**전체적인 디자인을 다시 만든다.** 토큰 전면 재작성 + 화면별 레이아웃·구성까지 재설계.

## 범위 분리

| 작업 | 담당 | 이 문서 |
|------|------|---------|
| 토큰 foundation (색·타이포·간격·radius·elevation·motion) + 로고 | `/design-system` | O — v1 |
| 화면별 레이아웃·구성 재설계 | 화면별 `/fe-ui-design` → TDD (별도 사이클) | X — 후속 |

`/design-system`은 컴포넌트 스킨(4d·4e)을 스킵한다 — 레이아웃 재설계가 컴포넌트를
어차피 뜯으므로, 토큰 클래스 적용은 그 과정에서 함께 한다.

## 참고 자산

- `docs/ui/host-audit-swea.md` — SWEA 호스트 팔레트 + 공존 규칙
- `docs/ui/brand/README.md` — 로고 사용 맵·색
- `docs/ui/ui-architecture.md` — OKLCH / `:host`·`:root` / 2 Surface / v1 고정 라이트
- `e2e/design-system.spec.ts-snapshots/` — before baseline
