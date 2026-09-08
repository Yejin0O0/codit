# login API Contract

> 이 문서는 익스텐션↔백엔드 API의 단일 기준점이다.
> test-scenarios, tdd-red-backend, tdd-green-backend는 이 문서를 참조한다.

## 엔드포인트 목록

| Method | Path | 역할 |
|--------|------|------|
| POST | `/api/auth/refresh` | Access Token 재발급 (Token Rotation 포함) |
| POST | `/api/auth/logout` | 로그아웃 — 서버 Refresh Token 삭제 |

두 경로 모두 기존 SecurityConfig의 `/api/auth/**` permitAll 범위에 포함.  
만료된 Access Token으로도 호출 가능.

---

## 요청/응답 명세

### POST /api/auth/refresh

**Request**
```
POST /api/auth/refresh
Authorization: Bearer {accessToken}   ← 만료되었거나 만료 임박한 토큰
(Request Body 없음)
```

BE 처리 순서:
1. `JwtTokenProvider.getUserIdIgnoreExpiry(token)` — 서명만 검증, 만료는 무시하고 userId 추출  
   (`ExpiredJwtException.getClaims().getSubject()` 활용)
2. DB에서 해당 userId의 `RefreshToken` 조회
3. `expiresAt` 확인 — 만료면 401 반환
4. 새 Access Token 발급 + 새 Refresh Token 발급 후 DB 교체 (Token Rotation)

**Response** `200 OK`
```json
{
  "accessToken": "string",
  "expiresAt": 1234567890123
}
```
`expiresAt`: Access Token 만료 시각 (Unix ms, `System.currentTimeMillis() + expirySeconds * 1000`)

**Error**
| 조건 | Status | code |
|------|--------|------|
| Authorization 헤더 없음 또는 서명 검증 실패 | 401 | `UNAUTHENTICATED` |
| DB에 해당 userId의 RefreshToken 없음 | 401 | `REFRESH_TOKEN_NOT_FOUND` |
| DB의 RefreshToken이 만료됨 | 401 | `REFRESH_TOKEN_EXPIRED` |

---

### POST /api/auth/logout

**Request**
```
POST /api/auth/logout
Authorization: Bearer {accessToken}
(Request Body 없음)
```

BE 처리:
1. `JwtTokenProvider.getUserIdIgnoreExpiry(token)` — userId 추출
2. DB에서 해당 userId의 `RefreshToken` 삭제 (없어도 정상 응답)
3. FE: `chrome.storage.local` 초기화 + 로그인 화면 전환 (FE 담당)

**Response** `200 OK`
```
(Body 없음)
```

**Error**
| 조건 | Status | code |
|------|--------|------|
| Authorization 헤더 없음 또는 서명 검증 실패 | 401 | `UNAUTHENTICATED` |

---

### POST /api/auth/login/{provider} — 변경사항

기존 `loginWithOAuth()`에 RefreshToken 저장 로직 추가.  
이번 이슈에서 함께 처리 (refresh가 동작하려면 로그인 시 Refresh Token이 DB에 있어야 함).

추가 처리:
- 기존 RefreshToken이 있으면 교체, 없으면 신규 저장
- `application.yml`에 `jwt.refreshTokenExpirySeconds` 설정 추가
- `RefreshTokenRepository` 신규 생성

응답 형식은 기존 `AuthTokenResponse` 유지 — 변경 없음.

---

## shared-types 변경 목록

### 신규 추가

- `packages/shared-types/src/auth.ts`

```typescript
export interface TokenRefreshResponse {
  accessToken: string;
  expiresAt: number;
}
```

### 수정 없음

- 기존 `AuthTokenResponse`, `LoginRequest`, `UserProfile` 변경 없음

---

## 에러 코드 전체 목록

| Status | code | 조건 |
|--------|------|------|
| 401 | `UNAUTHENTICATED` | Authorization 헤더 없음 또는 JWT 서명 검증 실패 |
| 401 | `REFRESH_TOKEN_NOT_FOUND` | DB에 해당 userId의 RefreshToken 없음 |
| 401 | `REFRESH_TOKEN_EXPIRED` | DB의 RefreshToken expiresAt 초과 |

`ErrorResponse` 형식:
```json
{ "code": "REFRESH_TOKEN_EXPIRED", "message": "..." }
```

---

## 구현 필요 항목 요약

| 항목 | 내용 |
|------|------|
| `JwtTokenProvider.getUserIdIgnoreExpiry()` | 만료 무시 userId 추출 메서드 신규 추가 |
| `RefreshTokenRepository` | 신규 생성 |
| `AuthServiceImpl.loginWithOAuth()` | 로그인 시 RefreshToken DB 저장 추가 |
| `AuthServiceImpl.refresh()` | 신규 — AccessToken 재발급 + Token Rotation |
| `AuthServiceImpl.logout()` | 신규 — RefreshToken 삭제 |
| `AuthController` | `/refresh`, `/logout` 엔드포인트 추가 |
| `AuthErrorCode` | `REFRESH_TOKEN_NOT_FOUND`, `REFRESH_TOKEN_EXPIRED` 추가 |
| `application.yml` | `jwt.refreshTokenExpirySeconds` 추가 |
| `shared-types/auth.ts` | `TokenRefreshResponse` 추가 |
