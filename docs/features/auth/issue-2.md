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

---

## 추가 구현: GoogleOAuthClientImpl 실제 연동 + JWT 인증 인프라

기존 구현에서 `GoogleOAuthClientImpl.getProfile()`이 `return null;` 스텁으로 남아있어 실제 로그인 호출 시 `NullPointerException`(500)이 발생함을 로컬 실행 중 확인. 또한 `AuthServiceImpl`이 발급하는 `accessToken`이 `UUID.randomUUID()`이며 JWT가 아니어서, prd.md ADR-1("JWT 기반 세션 관리")을 충족하지 못하고 "요청에서 현재 유저를 꺼내는 공통 코드"도 존재하지 않음. 이 두 가지를 이번 이슈 범위에 포함해 마무리한다.

### 시그니처

#### GoogleOAuthClientImpl — Google Token/UserInfo 실제 연동

```java
package com.codit.backend.client;

@Component
@ConfigurationProperties(prefix = "google.oauth")
public record GoogleOAuthProperties(
    String clientId,
    String clientSecret,
    String tokenUri,
    String userInfoUri
) {}

record GoogleTokenResponse(@JsonProperty("access_token") String accessToken) {}

@Component
public class GoogleOAuthClientImpl implements GoogleOAuthClient {

    GoogleOAuthClientImpl(RestClient.Builder restClientBuilder, GoogleOAuthProperties properties)

    @Override
    public GoogleProfile getProfile(String code, String redirectUri)
    // 1. POST {properties.tokenUri()} (form-urlencoded: code, client_id, client_secret, redirect_uri, grant_type=authorization_code) → GoogleTokenResponse
    // 2. GET {properties.userInfoUri()} + Authorization: Bearer {accessToken} → GoogleProfile
    //    (GoogleProfile 필드가 sub/email/name으로 Google UserInfo 응답과 1:1 매칭되어 별도 DTO 없이 역직렬화)
}
```

에러 케이스:
- 토큰/userinfo 엔드포인트 4xx/5xx → `RestClientResponseException` 그대로 전파
- 토큰 응답에 `access_token` 없음 → `IllegalStateException` 던짐
- 위 예외들은 `AuthServiceImpl.loginWithOAuth`의 기존 `catch (Exception e) → AuthException(OAUTH_FAILED)`에서 처리됨 (변경 불필요)

`application.yaml` 추가:
```yaml
google:
  oauth:
    client-id: ${GOOGLE_CLIENT_ID:}
    client-secret: ${GOOGLE_CLIENT_SECRET:}
    token-uri: https://oauth2.googleapis.com/token
    user-info-uri: https://www.googleapis.com/oauth2/v3/userinfo
```

#### JWT 발급 + 현재 유저 추출 공통 코드

```java
package com.codit.backend.security;

@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface CurrentUserId {}

@Component
public class JwtTokenProvider {
    JwtTokenProvider(JwtProperties properties)
    public String generateAccessToken(Long userId)
    public long getUserId(String token)   // 만료/위조 시 JwtException 계열 던짐
}

@Component
@ConfigurationProperties(prefix = "jwt")
public record JwtProperties(String secret, long accessTokenExpirySeconds) {}

@Component
public class CurrentUserArgumentResolver implements HandlerMethodArgumentResolver {
    // supportsParameter: @CurrentUserId 애노테이션 + Long 타입 파라미터
    // resolveArgument: Authorization: Bearer {token} 헤더 파싱 → jwtTokenProvider.getUserId(token)
    //   헤더 없음/형식 오류/토큰 무효·만료 → AuthException(UNAUTHENTICATED)
}

@Configuration
public class WebConfig implements WebMvcConfigurer {
    // addArgumentResolvers에 CurrentUserArgumentResolver 등록
}
```

`AuthErrorCode`에 `UNAUTHENTICATED(HttpStatus.UNAUTHORIZED, "인증이 필요합니다")` 추가.

`AuthServiceImpl.loginWithOAuth`의 `UUID.randomUUID().toString()` → `jwtTokenProvider.generateAccessToken(user.getId())`로 교체.

`build.gradle` 추가:
```
implementation 'io.jsonwebtoken:jjwt-api:0.12.6'
runtimeOnly 'io.jsonwebtoken:jjwt-impl:0.12.6'
runtimeOnly 'io.jsonwebtoken:jjwt-jackson:0.12.6'
```
(Spring Security 전체 도입은 하지 않음 — 이번 이슈 범위엔 과함. 필요해지면 `JwtTokenProvider`/리졸버를 Spring Security 필터로 교체 가능)

`application.yaml` 추가:
```yaml
jwt:
  secret: ${JWT_SECRET:dev-only-local-secret-key-please-override-in-prod-min-32-bytes}
  access-token-expiry-seconds: 3600
```

### 테스트 시나리오 체크박스 (추가)

- [x] GoogleOAuthClientImpl: 토큰 교환과 userinfo 호출이 모두 성공하면 sub/email/name이 채워진 GoogleProfile을 반환한다
- [x] GoogleOAuthClientImpl: userinfo 응답에 name이 없으면 name을 null로 매핑한다
- [x] GoogleOAuthClientImpl: 토큰 엔드포인트가 4xx/5xx를 응답하면 예외를 던진다
- [x] GoogleOAuthClientImpl: userinfo 엔드포인트가 4xx/5xx를 응답하면 예외를 던진다
- [x] GoogleOAuthClientImpl: 토큰 응답에 access_token이 없으면 예외를 던진다
- [x] JwtTokenProvider: 발급한 토큰에서 동일한 userId를 꺼낼 수 있다 (roundtrip)
- [x] JwtTokenProvider: 만료된 토큰이면 예외를 던진다
- [x] JwtTokenProvider: 서명이 위조된 토큰이면 예외를 던진다
- [x] AuthServiceImpl: 반환된 accessToken이 JWT이고 그 안의 userId가 로그인한 User.id와 일치한다 (기존 "accessToken 반환" 시나리오 강화)

> `CurrentUserArgumentResolver` 관련 4개 시나리오는 새 이슈로 분리 (별도 PR에서 Green 진행 예정)

#### 내 정보 조회 (신규) — `CurrentUserArgumentResolver`의 첫 소비처

```java
package com.codit.backend.controller;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserProfile> getMyInfo(@CurrentUserId Long userId)
}

package com.codit.backend.service;

public interface UserService {
    UserProfile getMyInfo(Long userId);
}
```

- 응답은 기존 `UserProfile` DTO 재사용
- 인증 안 됨/토큰 무효 → `CurrentUserArgumentResolver`에서 이미 401 처리 (컨트롤러 추가 처리 불필요)
- userId로 조회했는데 User 없음(탈퇴 등) → `AuthErrorCode.USER_NOT_FOUND(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다")` 추가, `AuthException(USER_NOT_FOUND)` 던짐 → 기존 `GlobalExceptionHandler`가 처리

### 테스트 시나리오 체크박스 (내 정보 조회, 추가)

- [ ] UserService.getMyInfo: userId가 존재하면 UserProfile을 반환한다
- [ ] UserService.getMyInfo: userId가 존재하지 않으면 AuthException(USER_NOT_FOUND)를 던진다
- [ ] UserController GET /api/users/me: 유효한 Bearer 토큰이면 200과 UserProfile을 반환한다
- [ ] UserController GET /api/users/me: Authorization 헤더가 없으면 401을 반환한다
- [ ] UserController GET /api/users/me: userId에 해당하는 User가 없으면 404를 반환한다

### 근거 대조

| 근거 | 커버 시나리오 |
|---|---|
| prd.md ADR-1 "JWT 기반 세션 관리" | JwtTokenProvider 정상/예외, AuthServiceImpl 강화 시나리오 |
| 로컬 실행 중 발견한 버그: GoogleOAuthClientImpl 스텁으로 인한 500 | GoogleOAuthClientImpl 정상/예외 시나리오 |
| 개발자 요청: "요청에서 JWT 읽어 현재 유저 꺼내는 공통 코드" | CurrentUserArgumentResolver 시나리오 전체 |
| 개발자 요청: "내 정보 조회 기능이 빠진 것 같다" | UserService/UserController 정상/예외 시나리오 |
| 기존 issue-2.md AC 5개 (팝업 표시, OAuth 팝업 오픈, DB 생성, 토큰 저장, 화면 전환) | 변경 없음 — 기존 커버 유지 |

`CurrentUserArgumentResolver`는 `UserController.getMyInfo`가 첫 소비처로 실제 사용됨.

---

## 로컬 E2E 검증 시행착오

백엔드 단위 테스트가 전부 통과한 뒤, 실제 크롬 확장 프로그램으로 Google 로그인을 끝까지 시도하며 발견한 3가지 문제와 조치. 자동화된 테스트로는 못 잡는 종류라 기록해둔다.

### 1. `redirect_uri_mismatch` (Google 400 에러)

**증상**: 로그인 버튼 클릭 → Google 계정 선택 화면 전에 `accounts.google.com/signin/oauth/error?authError=...` 400 페이지가 뜸.

**원인**: `chrome.identity.getRedirectURL()`은 `https://<확장 프로그램 ID>.chromiumapp.org/`를 반환하는데, `wxt.config.ts`에 `manifest.key`가 없어서 **압축해제 로드 시 확장 프로그램 ID가 로드 경로의 해시값으로 매번/사람마다 달라짐**. Google Cloud Console에 등록된 리다이렉트 URI와 일치하지 않아 거부됨.

**조치**: `wxt.config.ts`의 `manifest.key`에 고정 공개키를 추가해 ID를 `dcocnpglepbapllbgakbknajbcjpelkp`로 고정. Google Cloud Console의 OAuth 클라이언트에 `https://dcocnpglepbapllbgakbknajbcjpelkp.chromiumapp.org/`를 1회 등록. 이제 팀원 누구든 같은 빌드(`.output/chrome-mv3`, `-dev` 아님)를 로드하면 같은 ID가 나온다.

**주의**: 로드된 확장 프로그램을 "새로고침" 버튼으로 갱신해도 크롬이 이전 ID를 유지하는 경우가 있었음 — `key`를 처음 추가했을 때는 기존 확장 프로그램을 완전히 삭제하고 "압축해제된 확장 프로그램 로드"로 다시 추가해야 새 ID가 반영됐다.

### 2. CORS 에러 (팝업 → 백엔드 fetch 차단)

**증상**: 1번을 해결하고 Google 로그인 절차(계정 선택, 동의)까지는 정상 진행되고 팝업 창이 닫히는데, 확장 프로그램 팝업 화면이 로그인 화면 그대로 남아있음. 백엔드 로그(`bootrun.log`)에 요청 자체가 안 찍힘. 팝업 DevTools(우클릭 → 검사, "Preserve log" 체크 후 확인) 콘솔에서 CORS 에러 확인.

**원인**: `useAuth.ts`가 팝업(`chrome-extension://` origin)에서 `http://localhost:8080`으로 직접 `fetch`하는데, `wxt.config.ts`에 `host_permissions`가 없어서 일반 웹페이지와 동일하게 CORS 제약을 받음. 백엔드엔 CORS 허용 설정이 없어서 브라우저가 응답을 차단.

**조치**: `wxt.config.ts`에 `host_permissions: ['http://localhost:8080/*']` 추가. host_permissions가 있으면 확장 프로그램 컨텍스트의 요청은 CORS 검사 대상에서 제외되므로 백엔드 쪽 CORS 설정은 불필요.

### 3. `AuthException(OAUTH_FAILED)` — 실제 계정으로도 401

**증상**: 1, 2번을 해결하고 실제 Google 계정으로 로그인해도 계속 401 `OAUTH_FAILED`.

**원인**: 백엔드를 `./gradlew bootRun`으로 띄울 때 `backend/.env`를 자동으로 로드하는 장치(dotenv gradle 플러그인 등)가 없어서, `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`이 빈 값인 채로 기동됨 → Google 토큰 엔드포인트가 빈 client 자격증명을 거부.

**조치**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`만 환경변수로 export 후 기동.
```bash
export GOOGLE_CLIENT_ID=$(grep '^GOOGLE_CLIENT_ID=' backend/.env | cut -d= -f2-)
export GOOGLE_CLIENT_SECRET=$(grep '^GOOGLE_CLIENT_SECRET=' backend/.env | cut -d= -f2-)
./gradlew bootRun
```
**주의**: `backend/.env`를 통째로 `source`하면 안 된다 — `.env`의 `DB_PASSWORD`가 로컬 Postgres 실제 설정(기본값 `codit`/`codit`)과 달라서 `password authentication failed for user "codit"`로 기동 자체가 실패한다. DB 관련 값은 `application.yaml` 기본값을 그대로 쓰는 게 로컬 환경에서는 맞다.

### 검증 완료

세 가지 모두 조치 후 실제 Google 계정으로 로그인 → 200 응답 → 백엔드 로그에 `users`, `social_accounts` INSERT 쿼리 확인 → AC("DB에 User + SocialAccount 생성") 실증.
