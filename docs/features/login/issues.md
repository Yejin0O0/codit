# 로그인 기능 이슈 목록

## Issue 1: [로그인] Google 소셜 로그인 + 신규 계정 생성

### 설명
Google OAuth로 로그인하면 백엔드에 User + SocialAccount가 생성되고 JWT가 발급된다. 익스텐션 팝업에 Google 로그인 버튼이 표시되고, 로그인 완료 시 메인 화면으로 전환된다.

신규 파일: `LoginPage.tsx`, `SocialLoginButton.tsx`, `useAuth.ts`, `User.java`, `SocialAccount.java`, `RefreshToken.java`, `AuthController.java`, `AuthService.java`

### 완료 조건 (Acceptance Criteria)
- [ ] 팝업 열면 로그인 화면이 표시된다
- [ ] Google 로그인 버튼 클릭 시 OAuth 팝업이 열린다
- [ ] 인증 완료 후 User + SocialAccount가 DB에 생성된다
- [ ] Access Token이 `chrome.storage.local`에 저장된다
- [ ] 로그인 완료 후 메인 화면으로 전환된다

### 시나리오

**시나리오 A — 첫 Google 로그인**

**Given** 가입 이력이 없는 사용자가 팝업을 열었다  
**When** Google 로그인 버튼을 클릭하고 OAuth 인증을 완료한다  
**Then** DB에 User + SocialAccount(GOOGLE)가 생성되고 메인 화면이 표시된다

---

## Issue 2: [로그인] GitHub 소셜 로그인 + Account Linking

### 설명
GitHub OAuth 로그인을 추가한다. 동일 이메일로 이미 Google 계정이 있으면 기존 User에 GitHub SocialAccount를 연결한다(Account Linking).

의존: #1

### 완료 조건 (Acceptance Criteria)
- [ ] GitHub 로그인 버튼이 팝업에 표시된다
- [ ] GitHub OAuth 인증이 완료된다
- [ ] 동일 이메일 Google 계정이 있으면 기존 User에 SocialAccount(GITHUB)가 추가된다
- [ ] 신규 이메일이면 User + SocialAccount(GITHUB)가 새로 생성된다

### 시나리오

**시나리오 A — 기존 Google 계정과 Account Linking**

**Given** Google로 이미 가입된 사용자가 GitHub 로그인을 시도한다 (이메일 동일)  
**When** GitHub OAuth 인증을 완료한다  
**Then** 기존 User에 SocialAccount(GITHUB)가 추가되고 동일 계정으로 로그인된다

**시나리오 B — GitHub 신규 가입**

**Given** 가입 이력이 없는 사용자가 GitHub 로그인을 시도한다  
**When** GitHub OAuth 인증을 완료한다  
**Then** User + SocialAccount(GITHUB)가 새로 생성되고 메인 화면이 표시된다

---

## Issue 3: [로그인] JWT Silent Refresh + 로그아웃

### 설명
Access Token 만료 5분 이내 선제 갱신(axios interceptor), 401 fallback, 로그아웃 기능을 구현한다.

의존: #1

### 완료 조건 (Acceptance Criteria)
- [ ] API 요청 전 Access Token 만료 시각을 체크해 5분 이내면 선제 갱신한다
- [ ] 401 응답 시 Refresh Token으로 재발급 후 원래 요청을 재시도한다
- [ ] Refresh Token도 만료 시 로그인 화면으로 전환되고 "세션이 만료되었습니다" 안내가 표시된다
- [ ] 로그아웃 버튼 클릭 시 `chrome.storage.local`이 초기화되고 로그인 화면으로 전환된다

### 시나리오

**시나리오 A — 선제 갱신**

**Given** Access Token 만료까지 3분 남은 상태에서 API 요청이 발생한다  
**When** interceptor가 만료 시각을 확인한다  
**Then** 먼저 Access Token을 갱신한 뒤 원래 요청을 전송한다

**시나리오 B — Refresh Token 만료**

**Given** Access Token과 Refresh Token이 모두 만료된 상태다  
**When** API 요청이 발생한다  
**Then** 로그인 화면으로 전환되고 "세션이 만료되었습니다" 메시지가 표시된다

**시나리오 C — 로그아웃**

**Given** 로그인된 상태에서 로그아웃 버튼을 클릭한다  
**When** 로그아웃 처리가 완료된다  
**Then** `chrome.storage.local`이 초기화되고 로그인 화면이 표시된다
