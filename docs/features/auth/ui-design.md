# Auth Feature UI Design

> 이 문서는 tdd-green-frontend의 시각적 명세 참조 기준이다.
> 코드를 작성하지 않는다.
> 디자인 토큰·컴포넌트 규칙은 [../../ui/design-system.md](../../ui/design-system.md), 아키텍처는 [../../ui/ui-architecture.md](../../ui/ui-architecture.md) 참조.
> Problem History는 별도 문서: [../problem-history/ui-design.md](../problem-history/ui-design.md)

---

## Surface 전제

| 항목 | 확정 |
|------|------|
| UI Surface | **전용 Codit Extension Page** (브라우저 탭). Floating Widget(320px)·Popup 아님 |
| 위치 | Problem History와 **동일 Page**. 비로그인 → Auth, 로그인(mock) → Problem History |
| Timer Widget | 이번 Feature에서 건드리지 않는다. Auth Gate 추가하지 않는다 |
| 진입점 | "툴바 아이콘 → 전용 Page" 를 UI Flow로만 채택. toolbar action / manifest / chrome API 구현은 후속 기술 결정 |
| 데이터 | mock + React local state. fetch/axios/chrome.storage 없음 |
| 인증 상태 | Page 루트의 mock boolean `isAuthed`. 토큰·영속화 없음. submit 성공 시 전환만 시뮬레이션 |
| 화면 전환 | Page 최상위 단일 상태(`view`)로 관리. Router 라이브러리 없음 (timer의 `screen` 패턴과 동일) |
| 테마 | 고정 라이트, shadcn `neutral`, 기존 토큰 재사용 |

---

## User Flow

```
[Extension Page 열림]
       │
       ▼  (mock: isAuthed = false)
 ┌───────────┐   "계정이 없나요? 회원가입"   ┌───────────┐
 │  Login    │ ───────────────────────────▶ │  SignUp   │
 │  (view=   │ ◀─────────────────────────── │  (view=   │
 │   login)  │   "이미 계정이 있나요? 로그인" │   signup) │
 └─────┬─────┘                              └─────┬─────┘
       │ submit → (mock 성공)                     │ submit → (mock 성공)
       ▼                                          ▼
 isAuthed = true                          view = login
       │                                  + "가입 완료. 로그인해 주세요." 안내
       ▼
 [My Problem History]  (problem-history/ui-design.md)
```

- `view` 상태: `login | signup` — Problem History와 같은 Page 상위 상태에서 관리한다.
- **Login 성공**: `isAuthed = true` → HistoryView 로 전환.
- **SignUp 성공**: `view = login` 로 전환 + Login 화면 상단에 성공 안내 표시. **auto-login 하지 않는다** (Out of Scope).
- 비로그인 상태에서 Page 를 열면 항상 `view = login` 으로 시작한다.

---

## 와이어프레임

Page 배경 = `muted`, 카드 = `card`(흰색), 카드 `max-width ≈ 400px`, 수직·수평 중앙 정렬.

### ① Login — idle

```
┌──────────────────────────────────────────────┐
│                                              │
│                  ◆ Codit                     │  ← BrandHeader (로고 마크 + 워드마크)
│           문제풀이 기록을 관리하세요            │     서비스 식별 문구
│                                              │
│   ┌────────────────────────────────────┐     │
│   │ 이메일                              │     │  ← Label
│   │ ┌────────────────────────────────┐ │     │
│   │ │ you@example.com                │ │     │  ← Input type=email
│   │ └────────────────────────────────┘ │     │
│   │                                    │     │
│   │ 비밀번호                            │     │
│   │ ┌────────────────────────────────┐ │     │
│   │ │ ••••••••                       │ │     │  ← Input type=password
│   │ └────────────────────────────────┘ │     │
│   │                                    │     │
│   │ ┌────────────────────────────────┐ │     │
│   │ │            로그인               │ │     │  ← Button (submit)
│   │ └────────────────────────────────┘ │     │
│   └────────────────────────────────────┘     │
│                                              │
│        계정이 없나요?  회원가입 →             │  ← Button variant=link
│                                              │
└──────────────────────────────────────────────┘
```

### ①-a Login — SignUp 직후 진입 (성공 안내)

```
│   ┌────────────────────────────────────┐     │
│   │ ✓ 가입 완료. 로그인해 주세요.        │     │  ← Alert (성공 톤), 폼 상단
│   └────────────────────────────────────┘     │
│   (이하 ① Login idle 과 동일)                 │
```

- 안내는 SignUp 성공으로 넘어온 경우에만 1회 표시. 사용자가 입력을 시작하거나 view 를 다시 벗어나면 해제.

### ② Login — validation error (blur 또는 submit 시도)

```
│ 이메일                                        │
│ ┌────────────────────────────────┐            │
│ │ notanemail                     │ (aria-invalid) │
│ └────────────────────────────────┘            │
│ 올바른 이메일 형식이 아니에요                   │  ← FieldError (text-destructive text-xs)
│                                               │
│ 비밀번호                                       │
│ ┌────────────────────────────────┐            │
│ │                                │ (aria-invalid) │
│ └────────────────────────────────┘            │
│ 비밀번호를 입력해 주세요                        │
│                                               │
│ [        로그인 (disabled)        ]           │  ← 필수값 미충족/에러 시 비활성
```

### ③ Login — submitting

```
│ 이메일  [ you@example.com ] (disabled)         │
│ 비밀번호 [ •••••••• ]        (disabled)         │
│ [   ⟳  로그인 중…   ]  (disabled)              │  ← 인라인 SVG 스피너 + 라벨 (lucide 도입은 follow-up)
```

### ④ Login — server error (mock 실패)

```
│ ┌──────────────────────────────────────────┐  │
│ │ ⚠ 이메일 또는 비밀번호를 확인해 주세요.    │  │  ← FormAlert (role="alert"), 폼 상단
│ └──────────────────────────────────────────┘  │
│ 이메일  [ you@example.com ]                    │  ← 값 유지, 입력 재활성
│ 비밀번호 [ •••••••• ]                          │
│ [            로그인            ]               │  ← 재활성
```

### ⑤ SignUp — idle

```
┌──────────────────────────────────────────────┐
│                  ◆ Codit                     │  ← BrandHeader (Login보다 축약 — 로고만)
│                                              │
│   ┌────────────────────────────────────┐     │
│   │ 이메일                              │     │
│   │ [ you@example.com               ]  │     │  ← Input type=email
│   │                                    │     │
│   │ 비밀번호                            │     │
│   │ [ ••••••••                       ]  │     │  ← Input type=password
│   │                                    │     │
│   │ 비밀번호 확인                       │     │
│   │ [ ••••••••                       ]  │     │  ← Input type=password
│   │                                    │     │
│   │ [           회원가입            ]   │     │  ← Button (submit)
│   └────────────────────────────────────┘     │
│                                              │
│      이미 계정이 있나요?  로그인 →            │  ← Button variant=link
└──────────────────────────────────────────────┘
```

### ⑥ SignUp — validation error

```
│ 비밀번호 확인                                  │
│ [ ••••••                        ] (aria-invalid) │
│ 비밀번호가 일치하지 않아요                      │  ← signup 전용 규칙
```

---

## 검증 규칙 (전부)

| 필드 | 규칙 |
|------|------|
| 이메일 | 비어있지 않음 + `@` 포함 형식 |
| 비밀번호 | 비어있지 않음 |
| 비밀번호 확인 (signup) | 비밀번호와 동일 |

- **의도적으로 추가하지 않는다**: 비밀번호 길이/복잡도 규칙, 이메일 인증 안내, 약관 동의 체크박스, 닉네임/이름 필드, "로그인 상태 유지", 소셜 로그인 버튼, 비밀번호 찾기 링크.
- 전송 필드 가정: `email`, `password` (login) / `email`, `password` (signup). `passwordConfirm` 은 **클라이언트 전용**, 전송하지 않는다.

---

## 컴포넌트 트리

```
ExtensionPageShell                         [CUSTOM]  Page 프레임 (배경 / 중앙 정렬 / 헤더 슬롯) — Problem History와 공유
└─ <view: login | signup>  ← isAuthed = false
   └─ AuthView
      └─ AuthCard                          [EXTEND ← Card]  브랜드 슬롯 + 폼 슬롯 + 하단 링크 슬롯
         ├─ BrandHeader                    [CUSTOM]  로고 마크(인라인 SVG) + 서비스명 + 문구(login만)
         ├─ FormAlert                      [USE ← shadcn Alert]  (조건부) 서버 에러 / SignUp 성공 안내
         ├─ <form>
         │  ├─ FormField (email)           [USE ← Label + Input type=email]
         │  │   └─ FieldError (조건부)      인라인 <p class="text-destructive text-xs"> — primitive 재구현 아님
         │  ├─ FormField (password)        [USE ← Label + Input type=password]
         │  ├─ FormField (passwordConfirm) [USE ← Label + Input type=password]  ── signup 전용
         │  └─ SubmitButton                [USE ← Button]  loading / disabled 상태
         └─ AuthModeSwitchLink             [USE ← Button variant=link]  login ⇄ signup
```

---

## UI State

| 컴포넌트 | 상태 | 트리거 | 표현 |
|---------|------|--------|------|
| AuthView | `login` | 초기 진입 / "로그인" 링크 / SignUp 성공 | Login 폼 (필드 2) |
| AuthView | `signup` | "회원가입" 링크 | SignUp 폼 (필드 3) |
| FormField | idle | 진입 | placeholder, 중립 테두리 |
| FormField | typing | 입력 | 값 반영, 기존 에러는 입력 중 해제 |
| FormField | validation error | blur 또는 submit 시도 시 규칙 위반 | `aria-invalid`, FieldError 텍스트 표시 |
| SubmitButton | disabled | 필수값 미충족 OR 검증 에러 존재 OR submitting | opacity 50%, 클릭 불가 |
| SubmitButton | enabled | 모든 필수값 충족 + 에러 없음 | 활성 |
| Form | submitting | SubmitButton 클릭 (검증 통과) | 모든 입력·버튼·링크 disabled, 버튼 "⟳ 로그인 중…" / "⟳ 가입 중…" |
| FormAlert | hidden | 기본 | 렌더 안 함 |
| FormAlert | server error | mock 제출 실패 | 폼 상단 Alert (경고 톤), 입력값 유지, 폼 재활성 |
| FormAlert | signup success 안내 | SignUp 성공 후 `view=login` 진입 | 폼 상단 Alert (성공 톤) "가입 완료. 로그인해 주세요." — 입력 시작 시 해제 |
| AuthView | success transition (login) | mock 제출 성공 | `isAuthed = true` → HistoryView |
| AuthView | success transition (signup) | mock 제출 성공 | `view = login` + signup success 안내 |
| BrandHeader | full | `view=login` | 로고 + 서비스명 + 문구 |
| BrandHeader | compact | `view=signup` | 로고만 |

> 부모 영향: `Form.submitting = true` → 모든 FormField·SubmitButton·AuthModeSwitchLink `disabled`.

---

## Interaction

- **입력**: 각 FormField 는 controlled. blur 시 해당 필드 검증. 이미 에러 표시 중인 필드는 다시 유효해지면 즉시 에러 해제.
- **제출**: SubmitButton 클릭 → 전체 필드 검증 → 통과 시 `submitting` 진입 (mock 지연 시뮬레이션) → 성공/실패 분기.
  - Login 성공 → `isAuthed = true`
  - Login 실패 → FormAlert (경고) + 폼 재활성 (입력값 보존)
  - SignUp 성공 → `view = login` + 성공 안내
- **모드 전환**: AuthModeSwitchLink → `view` 토글. 전환 시 FieldError·FormAlert(경고) 초기화. 입력값은 보존하지 않아도 무방 (설계상 유지 여부는 구현 자율).
- **로딩 스피너**: 인라인 SVG (timer 의 "저장 완료 체크 아이콘 인라인 SVG" 선례와 동일). `lucide-react` 도입은 follow-up.

---

## USE / EXTEND / CUSTOM Mapping

| 요소 | 분류 | 근거 |
|------|------|------|
| Button (submit, link) | **USE** | shadcn `default` / `link` variant 그대로 |
| Input | **USE** | 이메일 / 비밀번호. `type` 속성만 사용 |
| Label | **USE** | 필드 라벨 |
| `AuthCard` | **EXTEND ← Card** | 브랜드 / 폼 / 링크 3슬롯 고정 레이아웃. Auth 2화면 공용 프레임 (timer 의 `PanelShell` 에 대응하는 Extension Page 판) |
| `FormAlert` | **USE ← shadcn Alert** (신규) | 서버 에러 / 성공 안내 영역. `role="alert"` 표준 구조. Auth 2곳 + (follow-up) History 로드 실패에서 재사용 → 공통화 가치. **npm 패키지 추가 없음** (Alert 는 cva/tailwind 단일 파일, Radix 의존 없음) |
| `FieldError` | inline (신규 primitive 아님) | `<p class="text-destructive text-xs">`. 컴포넌트화하되 interactive primitive 재구현 아님 |
| `BrandHeader` | **CUSTOM** | Codit 로고 마크(인라인 SVG) + 서비스명. 대응 primitive 없음. lucide 미도입 원칙과 동일하게 인라인 SVG |
| `ExtensionPageShell` | **CUSTOM** | 새 Surface (Extension Page) 프레임. Shadow DOM 위젯 프레임(`CoditWidget`)과 별개. Problem History와 공유 |
| SubmitButton 로딩 스피너 | inline SVG | timer 선례와 동일 |

> 공통 interactive primitive(Button / Input)를 단순 HTML `<button>` / `<input>` 으로 재구현하지 않는다.

---

## Loading / Empty / Error State

| 상태 | 처리 |
|------|------|
| Loading | 제출 중 = 버튼 인라인 스피너 + 폼 전체 disabled. **페이지 진입 로딩 없음** (mock, 즉시 렌더) |
| Empty | 해당 없음 (폼 화면) |
| Error (검증) | 필드 인라인 `FieldError` |
| Error (서버, mock) | 폼 상단 `FormAlert` (경고 톤). 입력값 보존, 폼 재활성 |

---

## Out of Scope (이번 Feature 제외)

- 실제 인증 API 연결 / 회원가입 API 연결
- JWT / token 저장, 인증 유지 구현
- 로그아웃 구현 세부 로직
- OAuth / 소셜 로그인
- 이메일 인증
- 비밀번호 찾기 / 재설정
- 비밀번호 정책 (길이·복잡도)
- 약관 동의 UI
- auto-login (SignUp 성공 후 자동 로그인)
- Timer Widget 에 Auth Gate 추가
- toolbar action / manifest / chrome API 구현
- Router 라이브러리 도입
- `chrome.storage` 연결

---

## Follow-up

| 항목 | 비고 |
|------|------|
| SignUp 성공 후 동선 | 이번 Draft = "Login 화면 + '가입 완료' 안내" 로 확정. auto-login 은 후속 |
| 실제 전송 필드 정렬 | 현재 `email` / `password` 만 전송 가정. API Contract 확정 시 정렬 |
| 로그아웃 진입점 | 후속. 이번엔 PageHeader 에 자리만 두고 미표시 |
| 인증 상태 영속화 | 후속 (`chrome.storage` 등) |
| 로딩 아이콘 lucide 전환 | 현재 인라인 SVG |

---

## Product Decision Required

**없음.** UI Surface / Auth Gate 범위 / SignUp 성공 동선은 모두 확정됨.
