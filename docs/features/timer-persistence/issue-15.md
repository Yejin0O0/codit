# Issue 15: [timer-persistence] Widget 접기/펼치기 + collapsed 타이머 표시

> Vertical Slice #1 / 3. 의존: 없음. 참조: `spec-fixed.md`(Widget 표현 상태·시나리오 F/G/H),
> `prd.md` ADR-5, `ui-design.md`(collapse UI + Accessibility), `issues.md` 공통 구현 제약.

## 시그니처

### 프론트엔드 (TypeScript)

#### `WidgetViewState` — 위젯 표현 상태

```ts
type WidgetViewState = 'expanded' | 'collapsed';
```

- 기본값 `'expanded'`. `App` 이 `useState<WidgetViewState>('expanded')` 로 소유
  (`screen` 과 별개). 새 App mount = 항상 `'expanded'`.

#### `App` — 분기 (`content/App.tsx`)

- `viewState === 'collapsed'` → `screen` 분기보다 **먼저**
  `<CoditWidget><CollapsedTimer seconds={elapsedSeconds} status={...} onExpand={() => setViewState('expanded')} /></CoditWidget>` 반환.
- `viewState === 'expanded'` → 기존 screen 분기 유지 + 각 screen 에
  `onCollapse={() => setViewState('collapsed')}` 전달.
- `status` = `screen === 'timer' ? 'running' : 'stopped'` (App 파생. `useTimer` 무변경 —
  결정 포인트 1 안 A).
- 접기/펼치기는 `screen`·`result`·`memo`·`memoOpen`·`selectedTagIds`·`customTags`·
  `useTimer` 를 바꾸지 않는다. `App` 은 unmount 되지 않는다(expanded subtree 만 조건부
  렌더로 unmount 될 수 있음 — 보존 필요 state 는 전부 `App` 소유이므로 재구성됨).

#### `PanelShell` — `onCollapse?` prop (`components/codit/panel-shell.tsx`)

```ts
interface PanelShellProps {
    title: string;
    step?: string;
    onCollapse?: () => void;   // 신규
    children: ReactNode;
    footer?: ReactNode;
    className?: string;
}
```

- `onCollapse` 주입 시: 헤더 최우측(step 오른쪽)에 아이콘 버튼 —
  `aria-label="Codit 타이머 접기"`, 내부 chevron-down 인라인 SVG `aria-hidden="true"`,
  shadcn `Button variant="ghost" size="icon"`. 클릭 시 `onCollapse()`.
- `onCollapse` 미주입 시: 접기 버튼 미렌더. 헤더/본문/푸터 렌더는 기존과 완전 동일.

#### `CollapsedTimer` — 신규 (`content/collapsed-timer.tsx`)

```ts
interface CollapsedTimerProps {
    seconds: number;                       // useTimer().elapsedSeconds
    status: 'running' | 'stopped';
    onExpand: () => void;
    ref?: Ref<HTMLButtonElement>;           // App 이 collapsed 진입 시 포커스 이동에 사용
}
export function CollapsedTimer(props: CollapsedTimerProps): JSX.Element;
```

- `<button type="button" onClick={onExpand}>` 하나 (shadcn `Button` 베이스,
  `variant="outline"` + 약 40px 높이 커스텀 크기 — 초소형 금지, `ui-design.md` Product
  Decision #1). 내부(순서대로):
  1. Codit 마크 인라인 SVG (`BrandHeader` 와 동일 `<path d="M8 0 16 8 8 16 0 8Z" />`) —
     `aria-hidden="true"` (결정 포인트 2 안 A: 자체 인라인 SVG)
  2. `<span className="sr-only">` — running: `"Codit 타이머 펼치기, 경과 시간 "` /
     stopped: `"Codit 타이머 펼치기, 완료됨, 풀이 시간 "`
  3. `<span>` 보이는 `mm:ss` — `formatDuration(seconds)`, `tabular-nums`, 실제 텍스트 노드
  4. `status === 'stopped'` 일 때만: check 인라인 SVG (`SaveSuccessScreen` 과 동일
     `<path d="M5 10.5l3.2 3.2L15 7" stroke="currentColor" .../>`) — `aria-hidden="true"`
  5. 펼치기 chevron-up 인라인 SVG (**상시** — `ui-design.md` Product Decision #3) —
     `<path d="M4 10l4-4 4 4" stroke="currentColor" .../>`, `aria-hidden="true"`
- accessible name = name-from-contents (sr-only + 보이는 시간) →
  running: `"Codit 타이머 펼치기, 경과 시간 12:35"` / stopped: `"Codit 타이머 펼치기, 완료됨, 풀이 시간 07:30"`.
- `aria-live` 미사용.
- 클릭 / Enter / Space 로 `onExpand` (native `<button>`).
- SVG 개수: running = 2 (Codit 마크 + chevron-up), stopped = 3 (+ check). 전부 `aria-hidden`.

#### screen prop 추가 (5개)

`content/screens/{TimerScreen,ResultSelectScreen,MemoScreen,TagSelectScreen,SaveSuccessScreen}.tsx`
각각 `onCollapse?: () => void` prop 추가 → 자신의 `<PanelShell onCollapse={onCollapse}>` 로 전달.

### 에러 케이스

| 상황 | 동작 |
|---|---|
| `PanelShell` 을 `onCollapse` 없이 렌더 | 접기 버튼 미렌더, 헤더 레이아웃 불변 |
| `CollapsedTimer` — collapsed + running | `useTimer` interval 계속 → `mm:ss` 계속 증가 |
| `CollapsedTimer` — collapsed + stopped | `seconds` 고정값 + check 아이콘 |
| expand 시 expanded subtree 재mount | `App` 소유 state 로 직전 화면·입력값 재구성 (subtree-local 미제출값은 초기화 가능) |
| `seconds` 비정상(음수 등) | `formatDuration` 이 처리(기존). `CollapsedTimer` 별도 방어 없음 |
| 접기/펼치기 도중 타이머 | 정지/재시작/초기화 없음. `screen` 불변 |

---

## 테스트 시나리오

### 정상

- [정상] `CollapsedTimer` — `status` 가 `running` 이면 `mm:ss` + SVG 2개(Codit 마크·펼치기 chevron)를 렌더하고 check 아이콘은 없다
- [정상] `CollapsedTimer` — `status` 가 `stopped` 이면 `mm:ss` + SVG 3개(+ check)를 렌더한다
- [정상] `CollapsedTimer` — running/stopped 무관하게 펼치기 chevron SVG 가 상시 렌더된다
- [정상] `CollapsedTimer` — 주어진 `seconds` 를 `mm:ss` 로 표시한다 (75 → `01:15`)
- [정상] `CollapsedTimer` — 클릭 시 `onExpand` 를 한 번 호출한다
- [정상] `CollapsedTimer` — Enter 와 Space 로 `onExpand` 를 호출한다
- [정상] `CollapsedTimer` — running 이면 accessible name 에 "펼치기" 동작 + "경과 시간" + 현재 `mm:ss` 를 포함한다
- [정상] `CollapsedTimer` — stopped 이면 accessible name 에 "펼치기" + "완료됨" + "풀이 시간" + `mm:ss` 를 포함한다
- [정상] `PanelShell` — `onCollapse` 가 주어지면 `aria-label="Codit 타이머 접기"` 버튼을 렌더한다
- [정상] `PanelShell` — 접기 버튼 클릭 시 `onCollapse` 를 한 번 호출한다
- [정상] `PanelShell` — `step` 과 접기 버튼이 함께 주어지면 둘 다 렌더한다 (접기 버튼이 step 뒤)
- [정상] `PanelShell` — 접기 버튼 내부 SVG 는 `aria-hidden` 이다
- [정상] `App` — 초기 `viewState` 는 expanded — 타이머 화면을 렌더하고 펼치기 버튼은 없다
- [정상] `App` — 타이머 화면에서 접으면 `CollapsedTimer`(running)를 표시하고 타이머 화면은 표시하지 않는다
- [정상] `App` — collapsed 에서 펼치면 타이머 화면으로 복귀한다
- [정상] `App` — "완료" 후 결과 선택 화면에서 접으면 `CollapsedTimer` 가 stopped(check 아이콘)로 표시된다
- [정상] `App` — "완료" 후 collapsed 에서 펼치면 결과 선택 화면으로 복귀한다
- [정상] `App` — 결과("오답")를 고른 뒤 접었다 펴면 그 결과 선택 상태가 유지된다
- [정상] `App` — collapsed + running 에서 시간이 흐르면 `CollapsedTimer` 의 `mm:ss` 가 증가한다

### 경계

- [경계] `CollapsedTimer` — `seconds` 가 0 이면 `00:00` 을 렌더한다
- [경계] `CollapsedTimer` — running ↔ stopped 전환 시 버튼은 하나이고 보이는 `mm:ss` 텍스트 노드가 유지된다
- [경계] `PanelShell` — `onCollapse` 가 있어도 `title` / `children` / `footer` 렌더는 정상이다
- [경계] `App` — memo / tags / success 화면에서도 접기 컨트롤이 존재한다
- [경계] `App` — "완료" 전 `CollapsedTimer` status 는 running, "완료" 후는 stopped 이다
- [경계] `App` — "완료" 후 collapsed 에서 시간이 더 흘러도 `CollapsedTimer` 의 `mm:ss` 가 고정된다 (ac-verifier 갭 2)
- [경계] `App` — 태그를 선택한 뒤 접었다 펴면 선택 상태가 유지된다 (ac-verifier 갭 3)
- [경계] `App` — 메모를 입력한 뒤 접었다 펴면 메모 내용이 유지된다 (ac-verifier 갭 3)

### 예외

- [예외] `CollapsedTimer` — 내부 장식 SVG(Codit 마크·check·펼치기 chevron)는 모두 `aria-hidden` 이어서 accessible name 에 섞이지 않는다
- [예외] `CollapsedTimer` — pill 버튼에 `aria-live` 속성이 없다
- [예외] `PanelShell` — `onCollapse` 미주입 시 접기 버튼을 렌더하지 않는다
- [예외] `PanelShell` — `onCollapse` 미주입 시 헤더는 `title`(+`step`)만 담고 기존 레이아웃을 유지한다
- [예외] `App` — 접기 → 펼치기 후 `screen` 이 바뀌지 않는다 (memo 화면에서 접었다 펴면 memo 화면)
- [예외] `App` — 접기 → 펼치기가 타이머를 초기화하지 않는다 (collapsed 동안 흐른 시간이 펼친 뒤에도 반영)
- [예외] `App` — 새 `<App>` mount 는 항상 expanded 이다

### 포커스 (키보드 흐름 — ui-design.md "Accessibility › 키보드")

- [정상] `App` — 타이머 화면에서 접으면 `CollapsedTimer` pill 로 포커스가 이동한다
- [정상] `App` — collapsed 에서 펼치면 그 화면 헤더의 접기 컨트롤로 포커스가 이동한다
- [경계] `App` — memo 화면에서 접었다 펴면 memo 화면의 접기 컨트롤로 포커스가 돌아온다
- [예외] `App` — 초기 mount(expanded) 시에는 접기 컨트롤로 포커스가 자동 이동하지 않는다 (SWEA 페이지 로드 시 포커스 탈취 방지)
- [경계] `App` — success(저장 완료) 화면에서도 접기 컨트롤이 존재한다
- [예외] `App` — success 화면에서 접었다 펴면 success 화면으로 복귀한다

---

## AC 커버리지

| AC | 커버 시나리오 |
| --- | --- |
| 1. 모든 화면 헤더에 접기 컨트롤 + `aria-label="Codit 타이머 접기"` | [정상] PanelShell aria-label 버튼 · [경계] App memo/tags/success 화면 각각에서 접기 컨트롤 존재 검증 · [예외] success 접기→펼치기 복귀 |
| 2. 접으면 pill 렌더, expanded subtree 사라짐 | [정상] App 타이머 화면 접기 → CollapsedTimer 표시·타이머 화면 미표시 |
| 3. collapsed running: `mm:ss` 초 단위 증가 | [정상] App collapsed+running 시간 흐름 시 증가 · [정상] CollapsedTimer seconds→mm:ss |
| 4. "완료" 후 collapsed: 시간 고정 + check, 색상 의존 X | [정상] App "완료" 후 stopped(check) · [경계] App "완료" 후 collapsed 시간 고정 · [정상] CollapsedTimer stopped check · [예외] SVG aria-hidden. "pill 폭" = 시각 설계, 단위 테스트 밖 |
| 5. pill 전체 펼치기 버튼, 상시 펼치기 chevron, accessible name(동작+시간, stopped "완료됨"), aria-hidden, aria-live 미사용, 키보드 흐름(전환 후 대응 컨트롤로 포커스 이동, 초기 로드 시 미탈취) | [정상] CollapsedTimer 클릭/Enter/Space·running·stopped name·chevron 상시 렌더 · [예외] 장식 SVG 전부 aria-hidden · [예외] aria-live 없음 · [포커스] 접기→pill·펼치기→접기 컨트롤·memo 복귀·초기 mount 미탈취 |
| 6. 펴면 직전 screen·입력값 그대로 | [정상] App 결과 고른 뒤 접었다 펴면 유지 · [예외] screen 불변 · [경계] 태그 선택 유지 · [경계] 메모 내용 유지 |
| 7. 접기/펼치기가 useTimer·screen·Timer 시작/완료/종료/초기화에 영향 0 | [예외] App screen 불변 · [예외] 타이머 초기화 안 됨 |
| 8. PanelShell 접기 컨트롤 없이 쓰는 기존 사용처 레이아웃 불변 | [예외] PanelShell onCollapse 미주입 시 버튼 미렌더 · [예외] 헤더 기존 레이아웃 유지 |
| 9. 새 document load 시 항상 expanded | [예외] App 새 mount 는 expanded |
| (회귀) 기존 Timer/Result/Memo/Tags | 기존 `App.test.tsx` 6개 + 전체 스위트 무회귀 (green 단계 확인) |

**단위 테스트 밖 (구현/디자인 리뷰 항목)**:
- AC-2 "top-right" — `#codit-root` 컨테이너 CSS(`mount.tsx`). pill 은 그 안에 렌더되어 위치 상속.
- AC-4 "pill 폭이 상태에 따라 크게 안 바뀜" — check 아이콘 자리 확보는 CSS. jsdom 정밀 검증 불가.
- Product Decision #1 "약 40px 높이 pill" — 치수는 Tailwind 클래스(`h-*`)로, jsdom 정밀 검증 불가. 시각 리뷰 항목.
