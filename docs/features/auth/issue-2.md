# Issue 2: Google 소셜 로그인 + 신규 계정 생성

## 테스트 시나리오 체크박스

### 프론트엔드

- [x] loginWithGoogle 호출 시 status가 loading으로 변경되어야 한다
- [x] 로그인 성공 후 status가 authenticated가 되고 토큰이 chrome.storage.local에 저장되어야 한다
- [x] 마운트 시 chrome.storage.local에 토큰이 있으면 authenticated 상태로 복원되어야 한다
- [x] loginWithGoogle 실패 시 status가 error가 되고 error 메시지가 세팅되어야 한다
- [x] PopupApp: status가 idle이면 LoginPage가 렌더링되어야 한다
- [x] PopupApp: status가 authenticated이면 MainPage가 렌더링되어야 한다
- [x] PopupApp: status가 error이면 LoginPage가 렌더링되어야 한다
- [x] SocialLoginButton: isLoading이 true일 때 스피너가 표시되고 버튼이 비활성화되어야 한다
- [x] SocialLoginButton: isLoading이 true일 때 클릭해도 onClick이 호출되지 않아야 한다

### 백엔드

- [x] AuthService: 지원하지 않는 provider이면 UNSUPPORTED_PROVIDER 예외를 던진다
- [x] AuthService: OAuth 코드 교환 실패 시 OAUTH_FAILED 예외를 던진다
- [x] AuthService: 신규 사용자는 User + SocialAccount가 생성된다
- [x] AuthService: 기존 소셜 계정 사용자는 User가 재사용된다
- [x] AuthService: 로그인 성공 시 accessToken과 expiresAt과 user 정보가 반환된다
- [x] AuthService: 동일 email 기존 User가 있으면 새 User를 생성하지 않는다
- [x] AuthController: POST /api/auth/login/{provider} 성공 시 200 응답
- [x] AuthController: code가 비어있으면 400 응답
- [x] AuthController: 지원하지 않는 provider이면 400 응답
- [x] AuthController: OAuth 실패 시 502 응답
