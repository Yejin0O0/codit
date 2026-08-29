---
name: tdd-green
description: >
  실패 중인 테스트를 통과시키는 최소한의 구현 코드를 작성하는 TDD Green 단계 스킬.
  "/tdd-green N", "Green 단계 진행", "테스트 통과시켜줘", "구현 코드 작성해줘",
  "실패 테스트 고쳐줘", "Green 단계 시작", "이슈 N 구현해줘" 등의 요청에
  반드시 이 스킬을 사용하세요. 이슈 번호를 받아 레이어를 감지한 뒤
  프론트엔드는 /tdd-green-frontend, 백엔드는 /tdd-green-backend로 위임합니다.
---

# TDD Green

`docs/features/{feature명}/issue-{N}.md`의 시그니처를 보고 레이어를 감지한 뒤
해당 서브스킬로 위임한다.

```
issue-{N}.md (시그니처 경로 확인)
    ↓ 레이어 감지
    [프론트엔드] → /tdd-green-frontend N
    [백엔드]     → /tdd-green-backend N
    [풀스택]     → 프론트엔드 완료 후 백엔드
```

---

## 시작 전: 입력 확인

- **이슈 번호**: `$ARGUMENTS`에서 추출.
- **시나리오 파일**: `docs/features/{feature명}/issue-{N}.md`를 읽는다.
  - 없으면: "`issue-{N}.md`가 없습니다. `/test-scenarios {N}`을 먼저 실행해주세요." 안내 후 중단.

---

## 레이어 감지

`issue-{N}.md`의 **시그니처 섹션**에 명시된 파일 경로를 기준으로 판단한다.

| 경로 패턴 | 레이어 |
|---|---|
| `apps/extension/` | 프론트엔드 |
| `backend/src/` | 백엔드 |
| 둘 다 포함 | 풀스택 |

경로가 명시되지 않은 경우, 이슈 제목과 설명에서 추론한다. 판단이 불명확하면 사용자에게 확인한다.

---

## 위임

### 프론트엔드

`/tdd-green-frontend N`을 실행한다.

### 백엔드

`/tdd-green-backend N`을 실행한다.

### 풀스택

프론트엔드를 먼저 완료한 뒤 백엔드를 이어서 실행한다.

```
/tdd-green-frontend N → 전체 통과 확인
/tdd-green-backend N  → 전체 통과 확인
```

두 레이어 모두 완료 후 전체 결과를 합산해서 요약한다.
