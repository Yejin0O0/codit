# Issue 52: [UI-L2 R0] 위젯 공통 프레임 재설계 — PanelShell · CoditWidget

> 참조: `prd.md`, `ui-design.md`. 에픽 #51.
> 리디자인 라운드 — `/test-scenarios` 대신 이 문서를 직접 작성 (design-system 계열 관례).
> **레이아웃만** 변경. props 시그니처·동작 로직 불변.

## 시그니처

### `PanelShell` (변경 없음 — 회귀 가드)

```tsx
interface PanelShellProps {
    title: string;
    step?: string;                 // "n / N" 형식. 파싱 불가 시 원문 텍스트 폴백
    onCollapse?: () => void;
    collapseControlRef?: Ref<HTMLButtonElement>;
    dragHandlers?: { onPointerDown?: (e: ReactPointerEvent<HTMLDivElement>) => void };
    children: ReactNode;
    footer?: ReactNode;
    className?: string;
}
export function PanelShell(props: PanelShellProps): JSX.Element;
```

### `CoditWidget` (변경 없음)

```tsx
export function CoditWidget({ children }: { children: ReactNode }): JSX.Element;
```

### `StepDots` — `panel-shell.tsx` 내부 로컬 (export 안 함)

```tsx
// "n / N" 문자열을 파싱해 도트 N개 렌더 (앞 n개 채움).
// 파싱 실패(형식 불일치, n>N, 숫자 아님 등) 시 원문 문자열을 그대로 텍스트로 렌더.
function StepDots({ step }: { step: string }): JSX.Element;
```

- 파싱 성공 조건: `/^\s*(\d+)\s*\/\s*(\d+)\s*$/` 매치 && `1 <= n <= N`
- 채운 도트: `data-filled="true"` / 빈 도트: `data-filled="false"`
- 도트 그룹 래퍼: `aria-label={`${n} / ${N} 단계`}`

## 시나리오

파일: `apps/extension/components/codit/panel-shell.test.tsx` (기존 파일 갱신)

### 회귀 가드 (기존 동작 유지 — 전부 통과해야 함)

- **[회귀] onCollapse 주입 시 `aria-label="Codit 타이머 접기"` 버튼을 렌더한다**
- **[회귀] 접기 버튼 클릭 시 onCollapse 를 한 번 호출한다**
- **[회귀] 접기 버튼 내부 SVG 는 `aria-hidden="true"` 다**
- **[회귀] onCollapse 미주입 시 접기 버튼을 렌더하지 않는다**
- **[회귀] title / children / footer 를 모두 렌더한다**
- **[회귀] dragHandlers 주입 시 헤더 pointerdown 이 onPointerDown 을 호출한다**
- **[회귀] dragHandlers 주입 시 헤더에 `cursor: grab` 클래스가 있다**
- **[회귀] pointerdown 대상이 접기 버튼이면 onPointerDown 을 호출하지 않는다** (`data-codit-no-drag`)
- **[회귀] dragHandlers 미주입 시 헤더에 grab 클래스가 없다**
- **[회귀] collapseControlRef 로 접기 버튼 요소에 접근할 수 있다**

### 신규 — 제목 시맨틱

- **[정상] title 이 heading(level 2)으로 조회된다** — `getByRole('heading', { level: 2, name: title })`

### 신규 — StepDots

- **[정상] step="2 / 4" → 도트 4개, `data-filled="true"` 2개 + `data-filled="false"` 2개** (순서: 채움이 앞)
- **[정상] step="3 / 3" → 도트 3개 전부 `data-filled="true"`**
- **[경계] step="1 / 1" → 도트 1개, `data-filled="true"`**
- **[정상] step="2 / 4" → 도트 그룹에 `aria-label="2 / 4 단계"` 가 있다**
- **[정상] step 미주입 → 도트/step 영역을 렌더하지 않는다**
- **[예외] step="곧 완료" (형식 불일치) → 원문 텍스트 "곧 완료" 를 렌더하고 도트는 없다**
- **[예외] step="5 / 3" (n > N) → 파싱 실패로 원문 "5 / 3" 텍스트 렌더** (도트 아님)
- **[정상] step 과 onCollapse 동시 주입 → 도트 그룹과 접기 버튼이 헤더에 함께 렌더된다**

### 신규 — 레이아웃 (얕은 단언만)

- **[정상] 헤더에 `border-b`, footer 렌더 시 footer 컨테이너에 `border-t` 가 있다** (구분 방식 A 유지 확인)
- **[정상] onCollapse 미주입 + step 미주입 시 헤더는 title 만 담는다** (기존 셀렉터 의존 테스트를 role 기반으로 교체)

## AC 대조

| AC (이슈 #52) | 커버 시나리오 |
| --- | --- |
| props 시그니처 불변 | 회귀 가드 10건 (시그니처 블록 그대로 컴파일) |
| 기존 동작 테스트 통과 (드래그·접기·focus) | [회귀] pointerdown / grab / data-codit-no-drag / collapseControlRef |
| 5개 위젯 화면 무결 | Storybook `screens.stories` 수동 확인 + `typecheck`(screens 가 PanelShell import) |
| a11y — 제목 시맨틱, 접기 aria-label 유지 | [정상] heading level 2 / [회귀] aria-label / [정상] 도트 aria-label |
| typecheck·lint·test·build green | tdd-green 후 CI 게이트 |
| 스크린샷 재설계 의도 일치 | `@ac-verifier` + 개발자 Storybook 눈 승인 (도트·roomy) |

## Out of Scope

- 각 화면 본문 (R1~R5), CollapsedTimer (R6)
- `mount.tsx` ↔ `--z-widget` 정리 — 이슈 "함께" 항목, 별 커밋 (테스트 대상 아님)
- 다크 모드, 새 토큰
