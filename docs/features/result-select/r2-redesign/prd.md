# ResultSelect 화면 재설계 — PRD (리디자인 브리프)

> Layer 2 R2. 에픽 #51 / 이슈 #65. R0(#52)·R1(#54) 위.
> `ResultSelectScreen`·`ResultToggleGroup` **레이아웃만** 재설계 — props 시그니처·동작 로직 불변.

## 배경

R1에서 Timer 화면이 "경과 시간을 focal element로" 재설계됐다. `ResultSelectScreen`은
기능 최초 구현 그대로다: 경과시간이 작은 muted 문장(`12:34 만에 풀이했어요.`)이고
`ResultToggleGroup`(정답/오답/보류)만 있어 R1과 톤이 어긋난다.

## 사용자 스토리

- **US-1** 결과를 고르는 화면에서도 방금 잰 시간이 여전히 눈에 띈다 (R1과 이어지는 톤).
- **US-2** 세 선택지(정답/오답/보류) 중 하나를 명확하게 고른다.

## 결정 (개발자 확정, 2026-09-09)

| 항목 | 결정 |
|------|------|
| 경과시간 표현 | **`TimerDisplay` 재사용** — 7xl focal, `caption="풀이 시간"`, `running` 없음(이미 멈춤). R1과 동일 컴포넌트로 화면 간 톤 통일 |
| step 배지 | **표시 안 함 (현행 유지)** — 결과를 고르기 전엔 총단계수 N을 모른다(HOLD=2단계, CORRECT/WRONG=3단계). 고정 상한 표시는 선택 후 분모가 줄어드는 부자연스러움이 있어 기각 |

## AC

- [ ] `ResultSelectScreen` props 시그니처 불변 (`elapsedSeconds`/`value`/`onChange`/`onNext`/`onCollapse`/`collapseControlRef`/`dragHandlers`)
- [ ] 경과시간이 `TimerDisplay`(7xl)로 렌더된다 — caption "풀이 시간", 펄스 도트 없음(멈춘 시간)
- [ ] 기존 작은 muted 문장(`"{시간} 만에 풀이했어요."`)은 제거된다
- [ ] `ResultToggleGroup`(정답/오답/보류) 선택 동작 불변 — 값 선택 전 "다음" 비활성
- [ ] `PanelShell`에 `step` prop을 넘기지 않는다 (배지 없음, 현행 유지)
- [ ] 접기·드래그·focus 회귀 없음 (R0 프레임)
- [ ] typecheck·lint·test·build·storybook green
- [ ] 스크린샷 재설계 의도 일치 (개발자 승인)

## Out of Scope

- 메모·태그·저장완료 화면 → R3~R5
- step 흐름 번호 체계 전면 재설계 — 이번엔 "배지 없음"만 재확인, 값 자체(Memo `2/3` 등) 변경 없음
- 다크 모드, 새 토큰
