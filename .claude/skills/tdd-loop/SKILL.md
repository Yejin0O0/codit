---
name: tdd-loop
description: GitHub 이슈 번호 하나를 받아 TDD 풀 사이클(사전 점검 → test-scenarios → tdd-red → tdd-green → ac-verifier → tdd-refactor → security-review → create-pr)을 순서대로 진행하는 오케스트레이터. "/tdd-loop N", "이슈 N번 TDD 풀 사이클 돌려줘", "이슈 N 전체 플로우 실행해줘" 같은 요청에 반드시 사용한다.
---

# tdd-loop

GitHub 이슈 하나를 끝까지 처리하는 TDD 풀 사이클 오케스트레이터.
각 단계는 기존 스킬/에이전트를 그대로 호출한다. 내부 승인 게이트는 유지된다.
이 스킬의 역할은 **순서 보장**뿐이다 — 추가 게이트를 만들지 않는다.

```
0. 사전 점검
   ↓
1. /test-scenarios   (시그니처 + 시나리오 승인 게이트)
   ↓
2. /tdd-red          (실패 테스트 작성)
   ↓
3. /tdd-green        (최소 구현)
   ↓
4. @ac-verifier      (AC 독립 검증)
   ↓
5. /tdd-refactor     (구조 개선 승인 게이트)
   ↓
6. /security-review  (타입·보안 점검 승인 게이트)
   ↓
7. /create-pr        (PR 생성 승인 게이트)
```

---

## 입력

`$ARGUMENTS` — GitHub 이슈 번호 (예: `15`)

---

## 0단계: 사전 점검

다음을 순서대로 확인한다. 하나라도 실패하면 사용자에게 알리고 중단한다.

```bash
gh issue view $ARGUMENTS        # 이슈 본문 + AC 확인
git status                      # uncommitted changes 확인
git branch --show-current       # 현재 브랜치 확인
```

**점검 항목**

1. **이슈 존재 여부** — `gh issue view`가 실패하면 중단. 이슈 번호가 맞는지 확인을 요청한다.

2. **Uncommitted changes** — `git status`에 변경사항이 있으면 중단. 커밋 또는 스태시 후 재실행하도록 안내한다.

3. **현재 브랜치** — `feature/<spec>` 형태의 브랜치에 있어야 한다. `main`이나 `fix/` 브랜치에 있으면 올바른 base 브랜치로 이동하도록 안내한다.

4. **작업 브랜치 중복 확인** — 이슈 제목에서 slug를 추출해 `feat/<issue-slug>` 브랜치가 이미 존재하는지 확인한다.
   - 없으면: `feature/<spec>`에서 분기 후 체크아웃
   - 있으면: 동일 이슈 재실행으로 간주하고 사용자에게 확인 (계속할지 / 취소할지)

slug 생성 규칙: 이슈 제목을 소문자로 변환, 공백과 특수문자를 `-`로 대체, 앞뒤 `-` 제거.
예: "태그 필터링 추가" → `feat/태그-필터링-추가`

사전 점검 통과 메시지:

```
✅ 사전 점검 완료
   이슈: #$ARGUMENTS — {이슈 제목}
   브랜치: feat/<slug> (base: feature/<spec>)

── 1단계: test-scenarios 시작 ──
```

---

## 1단계: /test-scenarios

`/test-scenarios $ARGUMENTS`를 실행한다.

이 스킬 내부에 승인 게이트가 2개 있다:

- 시그니처 확정 게이트
- 시나리오 확정 게이트

사용자가 응답해야 다음으로 진행된다. 완료되면:

```
── 2단계: tdd-red 시작 ──
```

---

## 2단계: /tdd-red

`/tdd-red $ARGUMENTS`를 실행한다.

collect 실패(ImportError)가 발생하면 스킬 내부 안내에 따라 스텁을 먼저 생성한다.
모든 시나리오가 AssertionError로 실패하는 상태가 되면:

```
── 3단계: tdd-green 시작 ──
```

---

## 3단계: /tdd-green

`/tdd-green $ARGUMENTS`를 실행한다.

5회 피드백 루프 내에 통과하지 못하면 스킬이 중단하고 사용자에게 보고한다.
전체 테스트 통과 시:

```
── 4단계: ac-verifier 시작 ──
```

---

## 4단계: @ac-verifier

`.claude/agents/ac-verifier.md`의 에이전트를 실행한다.

AC 갭이 발견되면 사용자에게 보고하고 추가 시나리오 작성 여부를 묻는다.
추가가 필요하면 2단계(/tdd-red)로 돌아가 반복한다.
갭이 없으면:

```
── 5단계: tdd-refactor 시작 ──
```

---

## 5단계: /tdd-refactor

`/tdd-refactor $ARGUMENTS`를 실행한다.

리팩토링 후보 승인 게이트가 내부에 있다. 사용자가 승인해야 진행된다.
완료되면:

```
── 6단계: security-review 시작 ──
```

---

## 6단계: /security-review

`/security-review $ARGUMENTS`를 실행한다.

즉시 수정 필요 항목 처리 게이트가 내부에 있다.
클린 상태 확인 후:

```
── 7단계: create-pr 시작 ──
```

---

## 7단계: /create-pr

`/create-pr`을 실행한다.

다음을 확인한다:

- PR base 브랜치: `feature/<spec>`
- PR body에 `Closes #$ARGUMENTS` 포함
- commitlint 통과

PR 생성 완료 후 해당 이슈에 PR 링크를 코멘트로 남긴다:

```bash
gh issue comment $ARGUMENTS --body "PR: <PR_URL>"
```

---

## 단계 실패 시 출력 형식

```
❌ {N}단계 ({단계명}) 실패

원인: {에러 메시지 또는 설명}

재개 방법:
  /{스킬명} $ARGUMENTS

중단 위치를 기억해두고, 원인을 해결한 뒤 해당 단계부터 재실행한다.
```

---

## 제약

- 각 스킬 내부의 사용자 승인 게이트는 그대로 작동한다. 건너뛰지 않는다.
- 이 스킬은 "다음 단계 진행할까요?" 같은 추가 게이트를 만들지 않는다.
- 단계 사이에는 진행 메시지만 출력한다.
- 중간 단계부터 재실행할 때는 `/tdd-loop`를 다시 실행하지 말고 해당 스킬을 직접 실행한다.
