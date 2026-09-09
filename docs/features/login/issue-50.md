# Issue 50: [로그인] JWT Silent Refresh 로그아웃 UI 배선 (#4 후속)

## 시그니처

### 프론트엔드 (TypeScript)

```typescript
// apps/extension/src/components/MainPage.tsx
interface MainPageProps {
    onLogout: () => Promise<void>;
}
export default function MainPage({ onLogout }: MainPageProps): JSX.Element
// data-testid="main-page"는 유지. 내부에 "로그아웃" 버튼을 추가해 onLogout을 호출한다.
// 페이지 레이아웃 재설계는 에픽 #51 R9/R10 범위 — 이번엔 버튼만 최소로 추가한다.

// apps/extension/src/components/LoginPage.tsx
interface LoginPageProps {
    onLoginWithGoogle: () => void;
    isLoading: boolean;
    error?: string | null;
    sessionExpiredMessage?: string | null; // 신규
}
export default function LoginPage({
    onLoginWithGoogle,
    isLoading,
    error,
    sessionExpiredMessage,
}: LoginPageProps): JSX.Element
// sessionExpiredMessage가 있으면 role="status" + text-muted-foreground로 렌더링한다.
// (error와 시각적으로 구분 — 세션 만료는 사용자 오류가 아닌 자연스러운 상태)

// apps/extension/src/components/PopupApp.tsx
export default function PopupApp(): JSX.Element
// const { authState, loginWithGoogle, logout } = useAuth();
// status === 'authenticated' → <MainPage onLogout={logout} />
// else → <LoginPage ... sessionExpiredMessage={authState.sessionExpiredMessage} />
```

### 에러 케이스

- 해당 없음 — 이번 이슈는 기존 `useAuth`/`authenticatedFetch` 로직(이슈 #4에서 구현·테스트 완료)을
  실제 컴포넌트에 배선하는 작업만 다룬다. 새 에러 처리 로직을 추가하지 않는다.

---

## 테스트 시나리오

### 정상

- [x] MainPage — 로그아웃 버튼을 렌더링한다
- [x] MainPage — 로그아웃 버튼 클릭 시 onLogout을 1회 호출한다
- [x] PopupApp — authenticated 상태일 때 logout을 MainPage의 onLogout으로 전달한다
- [x] LoginPage — sessionExpiredMessage가 있으면 role="status"로 렌더링한다
- [x] PopupApp — authState.sessionExpiredMessage를 LoginPage로 전달한다

### 경계

- [x] LoginPage — sessionExpiredMessage가 null이면 렌더링하지 않는다
- [x] LoginPage — error와 sessionExpiredMessage가 동시에 있으면 둘 다 렌더링한다

### 예외

- 해당 없음 (위 "에러 케이스" 참고)

---

## AC 커버리지

| AC | 커버 시나리오 |
|----|--------------|
| ~~AC1: authenticatedFetch 배선~~ | 보류 — 범위 제외 (2026-09-09 이슈 본문 수정, 바꿀 대상인 실제 API 호출 코드가 코드베이스에 없음) |
| AC2: 로그아웃 버튼이 useAuth().logout()을 호출하도록 배선 | [정상] MainPage — 버튼 클릭 시 onLogout 호출 / [정상] PopupApp — logout을 onLogout으로 전달 |
| AC3: sessionExpiredMessage가 있을 때 로그인 화면에 안내 문구 렌더링 | [정상] LoginPage 렌더링 / [경계] null일 때 미렌더링 / [경계] error와 동시 표시 / [정상] PopupApp — 값 전달 |
| AC4: 위 배선 상태에서 #4 AC 중 남은 두 항목을 E2E로 검증 | `e2e/login.spec.ts` — 로그아웃 클릭 시 storage 초기화+로그인 화면 전환 / storage의 sessionExpiredMessage 세팅 시 로그인 화면 전환+안내 표시 (이 PR에서 커버 완료) |
