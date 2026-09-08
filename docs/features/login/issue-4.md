# Issue 4: [로그인] JWT Silent Refresh + 로그아웃

## 시그니처

### 프론트엔드 (TypeScript)

```typescript
// apps/extension/src/hooks/useAuth.types.ts
export interface AuthState {
    user: UserProfile | null;
    accessToken: string | null;
    expiresAt: number | null;
    status: AuthStatus;
    error: string | null;
    sessionExpiredMessage: string | null; // 신규
}

// apps/extension/src/hooks/useAuth.ts
export function useAuth(): {
    authState: AuthState;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>; // 신규
}

// apps/extension/src/lib/authenticatedFetch.ts (신규)
export async function authenticatedFetch(url: string, init?: RequestInit): Promise<Response>
// 동작:
//   1. chrome.storage.local에서 accessToken, expiresAt 읽기
//   2. expiresAt - Date.now() < 5분 → POST /api/auth/refresh 선제 호출 후 storage 갱신
//   3. 요청 전송 (Authorization: Bearer {accessToken})
//   4. 401 응답 → refresh 재시도 → 성공 시 원래 요청 재전송
//   5. refresh 실패 → chrome.storage.local.set({ sessionExpiredMessage: '세션이 만료되었습니다' })
//                   + chrome.storage.local.remove(['accessToken', 'expiresAt'])
//
// useAuth.ts에 chrome.storage.onChanged 리스너 추가:
//   sessionExpiredMessage 감지 → authState 초기화 + sessionExpiredMessage 세팅

// apps/extension/src/components/MainPage.tsx
interface MainPageProps {
    onLogout: () => Promise<void>;
}
export default function MainPage({ onLogout }: MainPageProps): JSX.Element
```

### 백엔드 (Java)

```java
// backend/.../security/JwtTokenProvider.java — 신규 메서드
public long getUserIdIgnoreExpiry(String token);
// ExpiredJwtException 시 getClaims().getSubject() 활용
// 서명 검증 실패 시 → throw new AuthException(AuthErrorCode.UNAUTHENTICATED)

// backend/.../exception/AuthErrorCode.java — 신규 코드 추가
REFRESH_TOKEN_NOT_FOUND(HttpStatus.UNAUTHORIZED, "유효한 Refresh Token이 없습니다"),
REFRESH_TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "세션이 만료되었습니다"),

// backend/.../repository/RefreshTokenRepository.java — 신규
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByUser(User user);
    void deleteByUser(User user);
}

// backend/.../dto/TokenRefreshResponse.java — 신규
@Getter @Builder @NoArgsConstructor @AllArgsConstructor
public class TokenRefreshResponse {
    private String accessToken;
    private long expiresAt;
}

// backend/.../service/AuthService.java — 메서드 추가
TokenRefreshResponse refresh(String accessToken); // 만료된 토큰 허용
void logout(String accessToken);

// backend/.../controller/AuthController.java — 엔드포인트 추가
@PostMapping("/refresh")
public ResponseEntity<TokenRefreshResponse> refresh(
    @RequestHeader(value = "Authorization", required = false) String bearerToken);

@PostMapping("/logout")
public ResponseEntity<Void> logout(
    @RequestHeader(value = "Authorization", required = false) String bearerToken);
// 컨트롤러에서 "Bearer " 접두사 제거 후 서비스에 토큰 문자열만 전달
```

### 에러 케이스

| 조건 | 레이어 | 응답 |
|------|--------|------|
| bearerToken null / 형식 오류 / 서명 검증 실패 | BE | 401 UNAUTHENTICATED |
| DB에 해당 userId의 RefreshToken 없음 | BE | 401 REFRESH_TOKEN_NOT_FOUND |
| DB의 RefreshToken expiresAt 초과 | BE | 401 REFRESH_TOKEN_EXPIRED |
| FE에서 refresh 실패 감지 | FE | sessionExpiredMessage 세팅 → 로그인 화면 전환 |

---

## 테스트 시나리오

### 정상

- [정상] authenticatedFetch — 만료까지 5분 이내인 토큰이면 refresh를 먼저 호출한 뒤 원래 요청을 전송한다
- [정상] authenticatedFetch — 유효하고 만료 여유가 있는 토큰이면 Bearer 토큰을 담아 요청을 그대로 전송한다
- [정상] authenticatedFetch — 401 fallback refresh 성공 시 원래 요청을 재전송한다
- [정상] useAuth.logout — logout 호출 시 chrome.storage.local을 초기화하고 authState를 리셋한다
- [정상] useAuth — storage에 sessionExpiredMessage가 생기면 authState를 초기화하고 sessionExpiredMessage를 세팅한다
- [정상] AuthService.refresh — 만료됐지만 서명이 유효한 Access Token으로 호출 시 새 Access Token을 발급하고 Refresh Token을 교체한다
- [정상] AuthService.logout — 유효한 Access Token으로 호출 시 DB에서 Refresh Token을 삭제한다
- [정상] AuthServiceImpl.loginWithOAuth — OAuth 로그인 성공 시 Refresh Token을 DB에 저장한다
- [정상] JwtTokenProvider.getUserIdIgnoreExpiry — 만료됐지만 서명이 유효한 토큰이면 userId를 반환한다

### 경계

- [경계] authenticatedFetch — 만료까지 정확히 5분이면 선제 refresh를 트리거한다
- [경계] authenticatedFetch — 만료까지 5분을 초과하면 선제 refresh를 하지 않는다
- [경계] AuthService.logout — DB에 Refresh Token이 없어도 오류 없이 완료한다

### 예외

- [예외] authenticatedFetch — refresh 토큰도 만료된 경우 storage에 sessionExpiredMessage를 세팅하고 토큰을 삭제한다
- [예외] authenticatedFetch — 401 발생 시 refresh 재시도를 1회 초과하지 않는다
- [예외] AuthService.refresh — Bearer 토큰 서명이 유효하지 않으면 UNAUTHENTICATED를 던진다
- [예외] AuthService.refresh — 해당 userId의 Refresh Token이 DB에 없으면 REFRESH_TOKEN_NOT_FOUND를 던진다
- [예외] AuthService.refresh — Refresh Token의 expiresAt이 현재보다 과거이면 REFRESH_TOKEN_EXPIRED를 던진다
- [예외] AuthService.logout — Bearer 토큰 서명이 유효하지 않으면 UNAUTHENTICATED를 던진다
- [예외] JwtTokenProvider.getUserIdIgnoreExpiry — 토큰 서명이 유효하지 않으면 UNAUTHENTICATED를 던진다

---

## AC 커버리지

| AC | 커버 시나리오 |
|----|--------------|
| AC-1: 5분 이내면 선제 갱신 | [정상] 만료까지 5분 이내인 토큰이면 refresh를 먼저 호출 / [경계] 정확히 5분이면 트리거 / [경계] 5분 초과이면 트리거 안 함 |
| AC-2: 401 시 재발급 후 재시도 | [정상] 401 fallback refresh 성공 시 원래 요청 재전송 / [예외] refresh 재시도 1회 초과하지 않음 |
| AC-3: Refresh Token 만료 시 로그인 전환 + 메시지 | [예외] authenticatedFetch — refresh 토큰 만료 시 sessionExpiredMessage 세팅 / [정상] useAuth — sessionExpiredMessage 감지 시 authState 초기화 |
| AC-4: 로그아웃 → storage 초기화 + 로그인 전환 | [정상] useAuth.logout — chrome.storage.local 초기화하고 authState 리셋 |
