# 로그인 기능 PRD

## 1. 개요

SWEA 문제 풀이 통계 Chrome 익스텐션(Codit)에 소셜 로그인 기능을 추가한다.
Google, GitHub OAuth를 통해 사용자를 인증하고, JWT 기반으로 세션을 관리한다.
MVP는 개인 사용자 중심이나 팀 기능 확장을 고려해 User 엔티티를 독립적으로 설계한다.

---

## 2. 사용자 스토리

- 사용자로서, Google 계정으로 익스텐션에 로그인할 수 있다
- 사용자로서, GitHub 계정으로 익스텐션에 로그인할 수 있다
- 사용자로서, 두 소셜 계정의 이메일이 같으면 같은 계정으로 연결된다
- 사용자로서, 익스텐션을 닫았다 열어도 로그인 상태가 유지된다
- 사용자로서, 세션이 만료되면 자동으로 갱신되어 작업이 끊기지 않는다
- 사용자로서, 로그아웃할 수 있다

---

## 3. 기술 결정

### ADR-1. OAuth 인증 아키텍처 — 백엔드 주도 방식 채택

**Context**
Chrome 익스텐션에서 Google/GitHub 소셜 로그인을 구현해야 한다. 인증 주체를 어디에 둘지에 따라 외부 서비스 의존도, 확장성, 테스트 용이성이 달라진다. Firebase(외부 서비스 주도), chrome.identity(FE 주도), Spring Security OAuth2(BE 주도) 세 가지 안을 검토했다.

**Decision**
Spring Security OAuth2 + JWT 방식(BE 주도)을 채택한다. 백엔드가 OAuth 인증 흐름 전체를 담당하고, 익스텐션은 백엔드 로그인 URL을 호출해 JWT를 받아 저장한다.

**Alternatives**
- **Firebase Authentication 기각** — 외부 서비스 종속이 생겨 Firebase 정책 변경·장애에 영향을 받는다. 테스트 환경에서 SDK 모킹이 복잡하고, 장기적으로 통제권이 없다.
- **chrome.identity FE 주도 기각** — `chrome.identity.launchWebAuthFlow`는 Chrome 전용 API로 Firefox 등 크로스 브라우저 확장 시 재작업이 필요하다. 소셜 토큰을 FE가 직접 다루는 구조는 보안 감사 범위가 넓어진다.

**Consequences**
- (+) 인증 로직이 백엔드에 집중되어 역할(Role) 관리, 소셜 공급자 추가가 백엔드 변경만으로 가능하다
- (+) Spring Security 표준 패턴으로 팀 합류 시 학습 비용이 낮다
- (+) FE는 JWT 저장/갱신 로직만 담당해 관심사가 분리된다
- (-) 백엔드에 `spring-security`, `oauth2-client`, `jpa`, `jwt` 의존성 추가가 필요하다
- (-) 안 2(Firebase) 대비 백엔드 구현 공수가 크다

---

### ADR-2. 토큰 저장 위치 — chrome.storage.local + 백엔드 DB 분리

**Context**
JWT Access Token과 Refresh Token을 어디에 저장할지 결정해야 한다. Chrome 익스텐션은 웹과 달리 `chrome.storage.local`이라는 익스텐션 전용 격리 저장소를 제공한다.

**Decision**
- Access Token: `chrome.storage.local` (만료 시각 함께 저장)
- Refresh Token: 백엔드 DB (익스텐션에는 저장하지 않음)

**Alternatives**
- **Refresh Token을 chrome.storage.local에도 저장** — 오프라인 갱신이 가능하지만, 익스텐션이 탈취될 경우 Refresh Token까지 노출된다. 백엔드 DB에만 두면 서버 측에서 즉시 무효화가 가능하다.
- **Access Token을 인메모리에만 저장** — Manifest V3에서 서비스 워커가 수시로 종료되므로 인메모리 저장은 실용적이지 않다.

**Consequences**
- (+) `chrome.storage.local`은 웹 페이지 스크립트 접근 불가 — XSS 위험 없음
- (+) Refresh Token을 서버에만 두면 탈취·만료·강제 로그아웃을 서버에서 통제 가능
- (-) API 요청마다 `chrome.storage.local` 비동기 읽기가 필요하다 (interceptor에서 처리)

---

### ADR-3. 중복 이메일 처리 — Account Linking 채택

**Context**
동일 이메일로 Google과 GitHub 두 소셜 공급자가 모두 로그인을 시도할 수 있다. 계정을 분리할지, 하나로 연결할지 결정해야 한다.

**Decision**
동일 이메일이면 기존 User에 소셜 공급자를 추가 연결(Account Linking)한다. User와 SocialAccount를 1:N으로 분리 설계한다.

```
User(id, email, nickname, role, created_at)
SocialAccount(id, user_id, provider, provider_id, provider_email)
RefreshToken(id, user_id, token, expires_at)
```

로그인 조회 순서: provider_id 조회 → email 조회(Account Linking) → 신규 생성

**Alternatives**
- **계정 분리** — 구현이 단순하지만 동일 사용자가 계정 2개를 갖게 돼 데이터가 파편화된다. 나중에 병합이 어렵다.
- **에러 반환** — 같은 이메일로 다른 소셜 로그인 시 "이미 가입된 이메일" 에러. 사용자가 어떤 소셜로 가입했는지 잊으면 로그인이 막힌다.

**Consequences**
- (+) 사용자 입장에서 소셜 공급자와 무관하게 하나의 계정으로 통합
- (+) 소셜 공급자 추가 시 SocialAccount 행만 추가하면 되어 확장이 용이
- (-) 로그인 조회 로직이 2단계(provider_id → email)로 복잡해진다
- (-) 이메일이 다른 소셜 계정 간 연결은 이번 범위에서 지원하지 않음

---

### ADR-4. Silent Refresh 구현 방식 — 요청 시점 선제 갱신

**Context**
Manifest V3에서 백그라운드 서비스 워커는 수시로 종료되므로 타이머 기반 토큰 갱신이 신뢰할 수 없다. 사용자 요청이 끊기지 않으면서도 토큰을 안전하게 유지해야 한다.

**Decision**
타이머 대신 **API 요청 직전 interceptor에서 만료 시각을 체크**해 5분 이내면 선제 갱신 후 요청한다. 예외 상황(장시간 비활성 후 재접속)에는 401 응답 시 Refresh Token으로 재발급 → 원래 요청 재시도하는 fallback을 병행한다.

**Alternatives**
- **타이머 기반 선제 갱신** — UX는 동일하지만 서비스 워커가 종료되면 타이머가 사라져 Manifest V3 환경에서 신뢰할 수 없다.
- **401 발생 후 갱신만 (Reactive)** — 구현이 단순하지만 사용자 요청이 한 번 실패하는 순간이 존재한다.

**Consequences**
- (+) 서비스 워커 종료와 무관하게 동작 — Manifest V3 환경에서 안정적
- (+) 사용자 요청이 끊기는 순간 없음
- (-) 모든 API 요청에 interceptor 처리 비용이 추가됨 (미미한 수준)

---

## 4. Out of Scope

- 일반 이메일/비밀번호 로그인
- 비밀번호 찾기 / 재설정
- 이메일 인증 (이메일 소유권 검증)
- SWEA 계정 연동 검증
- 초대 코드 기반 가입 제한
- 이메일이 다른 소셜 계정 간 수동 Account Linking
- 세션 목록 조회 및 개별 로그아웃 UI
- 팀/그룹 기능
- 관리자 역할(Role) 관리 UI (Role 컬럼은 추가하되 관리 화면은 제외)
- Kakao, Apple 등 추가 소셜 공급자 (구조만 확장 가능하게 설계)

---

## 5. 용어 정의

spec-fixed.md 용어 정의 참조.
