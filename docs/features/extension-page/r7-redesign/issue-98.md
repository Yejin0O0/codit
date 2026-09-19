# Issue 98: [UI-L2 R7] 페이지 공통 프레임 재설계 — ExtensionPageShell · PageHeader

## 시그니처

### 프론트엔드 (TypeScript)

**[확정] `ExtensionPageShell` Props — 변경 없음**

```ts
interface ExtensionPageShellProps {
    maxWidth: number;
    header?: ReactNode;
    children: ReactNode;
    className?: string;
}
export function ExtensionPageShell(props: ExtensionPageShellProps): JSX.Element;
```

내부 변경(시그니처 아님): `children`을 `data-slot="extension-page-shell-content"`
(`bg-background rounded-lg border shadow-sm`) 카드로 감싼다.

**[확정] `PageHeader` Props — 변경 없음**

```ts
interface PageHeaderProps {
    userName?: string;
    className?: string;
}
export function PageHeader(props: PageHeaderProps): JSX.Element;
```

내부 변경(시그니처 아님): 루트 `<header>` className에
`bg-background/95 sticky top-0 z-10 backdrop-blur-sm` 추가, `py-3` → `py-3.5`.

### 에러 케이스

없음 — 순수 표현 컴포넌트.

**결정 포인트**: 없음 — 스파이크(prd.md)에서 Option C로 확정.

### 비-TS 변경

없음 — 토큰 변경 없이 기존 `--background`/`--border`/`shadow-sm` 유틸리티만 조합.

---

## 테스트 시나리오

> 기존 `extension-page-shell.test.tsx` / `page-header.test.tsx`에 추가.
> `describe` 영어 / `it` 한국어 현재형.

### 정상

- [정상] ExtensionPageShell — children을 카드 프레임(콘텐츠 슬롯)으로 감싼다
- [정상] ExtensionPageShell — 카드 프레임이 `bg-background`·`rounded-lg`·`border`·`shadow-sm` 클래스를 가진다
- [정상] PageHeader — 스크롤 시 고정되도록 `sticky`·`top-0` 클래스를 가진다

### 경계

- [경계] ExtensionPageShell — header 없어도 카드 프레임은 그대로 적용된다 (기존 `header 생략` 테스트로 커버)

### 예외 (회귀 가드)

- [회귀] ExtensionPageShell — 기존 6개 테스트(centered container·header 순서·maxWidth px·muted 배경·className 병합·header 생략) 전부 그대로 통과
- [회귀] PageHeader — 기존 7개 테스트(브랜드·설명 생략·userName·로그아웃 placeholder 계약 4종) 전부 그대로 통과

---

## AC 커버리지

| AC | 커버 시나리오 |
| --- | --- |
| props 시그니처 불변 | 시그니처 [확정] + 기존 테스트 전건 통과 |
| 기존 유닛 테스트 전부 통과 | [회귀] 2건 |
| App.tsx 두 상태 모두 새 프레임에서 안 깨짐 | Storybook `HistoryLoggedIn`/`AuthPlaceholder` + `App.test.tsx` 기존 스위트 |
| a11y — header 랜드마크 유지, 대비 axe | `<header>` 태그 불변 확인 + Storybook a11y addon |
| typecheck·lint·test·build·storybook green | tdd-green + security-review |
| 전/후 스크린샷 | create-pr — `docs/features/extension-page/r7-redesign/screenshot-r7-*.png` |
