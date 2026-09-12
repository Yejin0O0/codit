# Issue 61: [로그인] 로그아웃/세션 만료 경계 케이스 테스트 보강 (#50 후속)

## 시그니처

### 프론트엔드 (TypeScript)

프로덕션 시그니처 변경 없음 — 기존 `PopupApp`, `LoginPage`, `useAuth`의 인터페이스를 그대로 사용해 테스트만 추가한다.

**PopupApp 통합 테스트 — 상태 전이 시뮬레이션**

기존 `PopupApp.test.tsx`의 `mockAuthState` 헬퍼를 재호출해 `useAuth` mock 반환값을 `idle`로 교체하고, RTL `rerender()`로 재렌더를 트리거해 실제 상태 전이를 시뮬레이션한다.

```ts
it('로그아웃 버튼 클릭 후 status가 idle로 바뀌면 MainPage 대신 LoginPage가 렌더링되어야 한다', async () => {
    const logout = vi.fn().mockResolvedValue(undefined);
    mockAuthState('authenticated', { accessToken: 'token' }, { logout });
    const user = userEvent.setup();
    const { rerender } = render(<PopupApp />);

    await user.click(screen.getByRole('button', { name: '로그아웃' }));
    mockAuthState('idle');
    rerender(<PopupApp />);

    expect(screen.queryByTestId('main-page')).not.toBeInTheDocument();
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
});
```

**LoginPage 경계 테스트 — 빈 문자열 sessionExpiredMessage**

```ts
it('sessionExpiredMessage가 빈 문자열이면 안내 문구가 표시되지 않아야 한다', () => {
    render(<LoginPage onLoginWithGoogle={vi.fn()} isLoading={false} sessionExpiredMessage="" />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
});
```

### 에러 케이스

해당 없음 — 이 이슈는 기존 정상/경계 동작의 테스트 커버리지 갭을 메우는 것이며, 새로운 에러 케이스를 도입하지 않는다.

---

## 테스트 시나리오

### 정상

- [정상] PopupApp — should render LoginPage instead of MainPage when logout transitions auth status to idle

### 경계

- [경계] LoginPage — should not render session-expired notice when sessionExpiredMessage is an empty string

### 예외

해당 없음 — 시그니처 단계에서 확인한 대로 이 이슈는 새로운 에러 케이스를 도입하지 않는다.

---

## AC 커버리지

| AC | 커버 시나리오 |
|----|--------------|
| AC-1 (PopupApp 통합 테스트 — 로그아웃 후 MainPage→LoginPage 전환 확인) | [정상] PopupApp — should render LoginPage instead of MainPage when logout transitions auth status to idle |
| AC-2 (LoginPage — sessionExpiredMessage 빈 문자열 시 안내 문구 미표시 확인) | [경계] LoginPage — should not render session-expired notice when sessionExpiredMessage is an empty string |
