# 로그인 기능 요구사항

## 개요

소셜 로그인(Google, GitHub)만 제공하는 인증 시스템. 일반 이메일/비밀번호 로그인 없음.
Google이 최우선 구현 대상. MVP는 개인 사용자 중심이나 팀 기능 확장을 고려해 User 엔티티를 독립적으로 설계한다.

---

## 사용자 시나리오

**시나리오 1 — 첫 로그인**
소셜 로그인 버튼 클릭 → OAuth 인증 → 계정 자동 생성 → 로그인 완료

**시나리오 2 — 재로그인**
이미 가입된 계정으로 소셜 로그인 → 기존 계정 연결 → 로그인 완료

**시나리오 3 — 로그아웃**
로그아웃 버튼 클릭 → 세션 종료 → 비로그인 상태로 전환

---

## 경계 조건 및 엣지 케이스

**OAuth 팝업 취소**
팝업만 닫힘. 별도 알림 없음. 버튼이 다시 클릭 가능한 상태로 돌아옴.

**동일 이메일 중복 가입 (Account Linking)**
Google로 가입한 이메일로 GitHub 로그인 시, 기존 계정에 GitHub 소셜 공급자를 추가 연결한다. 계정을 분리하지 않는다.

로그인 조회 순서:
1. provider + provider_id로 SocialAccount 조회
2. 없으면 email로 User 조회 → 기존 User에 SocialAccount 추가
3. 그것도 없으면 User + SocialAccount 신규 생성

**신규 가입 제한**
누구나 가입 가능. 별도 제한 없음.

**멀티 디바이스**
여러 브라우저에서 동시 로그인 허용. 세션 수 제한 없음.

---

## 토큰 관리

**저장 위치**
- Access Token: `chrome.storage.local` (익스텐션 샌드박스, 웹 페이지 접근 불가)
- Refresh Token: 백엔드 DB (익스텐션에 저장하지 않음)

**Silent Refresh (선제 갱신)**
API 요청 직전, chrome.storage.local에서 Access Token을 꺼내 JWT의 `exp`를 디코딩해 만료까지 5분 이내면 먼저 갱신 후 요청한다.

**401 Fallback**
선제 갱신이 작동하지 않은 예외 상황(익스텐션 장시간 비활성 등)에서 401 응답 수신 시:
- Refresh Token으로 Access Token 재발급 → 원래 요청 재시도
- Refresh Token도 만료 → 로그인 화면 전환 + "세션이 만료되었습니다" 안내

---

## 에러 처리 방식

| 케이스 | 처리 방식 |
|---|---|
| OAuth 인증 실패 | 로그인 화면 인라인 메시지 |
| 백엔드 통신 오류 | 로그인 화면 인라인 메시지. 타임아웃(10초) + 1회 자동 재시도 후 에러 표시 |
| 토큰 갱신 실패 | 로그인 화면으로 전환 + "세션이 만료되었습니다" 인라인 안내 |

---

## UI 방향

- MVP 단계에서 디자인 시스템 없이 단순 구현
- `Button`, `Logo` 등 컴포넌트 단위로 분리해 추후 디자인 시스템 적용 시 해당 파일만 교체하면 전체 반영되도록 구조화
- 로직과 스타일 혼재 금지

---

## 향후 확장 고려사항

- 소셜 공급자 추가 가능성 있음 (Kakao, Apple 등) → SocialAccount 테이블에 `provider` 컬럼으로 확장
- 관리자 등 역할(Role) 구분 필요 → User 테이블에 `role` 컬럼 추가 예정
- 팀 기능 가능성 있음 → User 엔티티를 처음부터 독립적으로 설계

---

## Out of Scope (초안)

- 일반 이메일/비밀번호 로그인
- 비밀번호 찾기 / 재설정
- 이메일 인증
- SWEA 계정 연동 검증
- 초대 코드 기반 가입 제한
- 세션 목록 관리 UI
- 팀/그룹 기능

---

## 용어 정의

| 용어 | 정의 |
|---|---|
| 소셜 공급자 (Provider) | Google, GitHub 등 OAuth 인증을 제공하는 외부 서비스 |
| Account Linking | 동일 이메일의 다른 소셜 공급자 계정을 하나의 User에 연결하는 것 |
| Access Token | 단기 유효 JWT. chrome.storage.local에 저장. API 요청 시 사용 |
| Refresh Token | 장기 유효 토큰. 백엔드 DB에만 저장. Access Token 재발급에 사용 |
| Silent Refresh | 사용자 개입 없이 백그라운드에서 Access Token을 자동 갱신하는 것 |
| SocialAccount | 한 User에 연결된 소셜 공급자 계정 정보 (provider, provider_id 등) |
