# CollapsedTimer r6-redesign UI Design

> 이 문서는 tdd-green-frontend의 시각적 명세 참조 기준이다.
> 코드를 작성하지 않는다.

## 와이어프레임

### CollapsedTimer — running (재설계 후)

```
┌────────────────────────────┐
│  Ⓒ  12:34  •  ⌃            │  ← • = LiveDot (민트 animate-ping), 시간 뒤 / chevron 앞
└────────────────────────────┘
   h-10 rounded-full px-3.5 shadow-lg · variant=outline (불변)
```

### CollapsedTimer — stopped (변경 없음)

```
┌────────────────────────────┐
│  Ⓒ  12:34  ✓  ⌃            │  ← ✓ = success 체크 (기존)
└────────────────────────────┘
```

running/stopped 은 배타적 — "시간 뒤 슬롯"에 running=`LiveDot`, stopped=체크가 들어간다.
둘 다 민트/그린 계열 상태 글리프라 위치 일관.

### TimerDisplay — running (추출만, 시각 변화 없음)

```
        12:34            ← text-7xl (불변)
      •  측정 중          ← • = LiveDot, 캡션 앞 (기존과 동일 — 인라인 마크업이 <LiveDot>로 바뀔 뿐)
```

---

## 컴포넌트 트리

```
LiveDot (신규 CUSTOM — components/codit/live-dot.tsx)
└── span[aria-hidden]  .relative .flex .size-1.5
    ├── span  .bg-success .animate-ping .rounded-full .opacity-60   (후광)
    └── span  .bg-success .size-1.5 .rounded-full                    (중심점)

CollapsedTimer (변경)
└── Button (outline, h-10 rounded-full)
    ├── CoditMark            (불변)
    ├── span.sr-only         (불변 — name-from-contents 레이블)
    ├── span  {mm:ss}        (불변)
    ├── LiveDot              ★ status==='running' 일 때만 (신규)
    ├── svg check            (불변 — status==='stopped' 일 때만)
    └── svg chevron-up       (불변 — 상시)

TimerDisplay (추출 배선)
└── ...
    └── p.caption
        ├── LiveDot          ★ 인라인 <span> 3줄 → <LiveDot /> 호출로 교체 (running일 때)
        └── span {caption}
```

`LiveDot`는 새 npm/아이콘 없음 — Tailwind 유틸 + `<span>`.

---

## UI State

| 컴포넌트 | 상태 | 트리거 | 표현 |
|---------|------|--------|------|
| CollapsedTimer | running | `status='running'` | 시간 뒤 `LiveDot` 펄스, 체크 없음, chevron 상시 |
| CollapsedTimer | stopped | `status='stopped'` | 시간 뒤 success 체크, `LiveDot` 없음, chevron 상시 |
| LiveDot | (상태 없음) | 부모가 렌더 여부 결정 | 민트 도트 + `animate-ping` 후광. `aria-hidden` |
| TimerDisplay | running + caption | `running && caption` | 캡션 앞 `LiveDot` (기존 동작 유지) |
| TimerDisplay | caption only | `caption` 만 | 도트 없음 (기존) |

부모(App.tsx) 상태 영향: 없음 — `status`는 이미 App.tsx가 계산해 prop으로 넘긴다.

`prefers-reduced-motion` 시 `animate-ping`은 tokens.css 전역 `@media`가 정지시킨다 (도트 자체는 남음 = 정적 상태 표시).

---

## shadcn/ui 사용 컴포넌트

새로 추가되는 shadcn/ui 컴포넌트 없음.

| 컴포넌트 | 용도 | 커스터마이징 |
|---------|------|------------|
| — | — | `LiveDot`은 CUSTOM (대응 primitive 없음) |

---

## Out of Scope (이번 Feature 제외)

- pill 레이아웃 재배치 / 드래그·클릭 로직 (#20)
- `TimerDisplay` 도트 위치·모양 변경 (순수 추출만)
- `--z-*` 토큰 (#80)
- motion 토큰 `@theme` 연결 (제거로 결정)
