---
name: create-pr
description: >
  PR 생성을 자동화하는 스킬. "PR 만들어줘", "PR 올려줘", "PR 보내줘", "이거 머지하자",
  "create-pr", "/create-pr" 등의 요청에 반드시 이 스킬을 사용하세요.
  현재 브랜치 변경사항을 분석해 PR 초안을 작성하고, 개발자 승인 후 E2E 테스트를 실행합니다.
  통과하면 PR을 생성하고, 실패하면 근본 원인 수정 절차를 안내합니다.
  PR과 관련된 모든 요청 — 올리기, 만들기, 보내기, 머지 준비 — 에 적극적으로 이 스킬을 사용하세요.
---

# create-pr

현재 브랜치의 변경사항을 분석해 PR 초안을 생성하고, E2E 테스트를 통과한 뒤 PR을 올린다.

```
변경사항 분석
    ↓ PR 초안 생성 (제목 + 본문)
    ↓ [GATE] 개발자 승인 (수정 가능)
    ↓ npm run test:e2e
    ↓ 실패 → 수정 절차 안내 후 중단
    ↓ 통과 → git push → gh pr create
```

---

## 1단계: 변경사항 분석

```bash
git branch --show-current
git log main...HEAD --oneline
git diff main...HEAD --stat
```

파악할 내용:

- 현재 브랜치명과 base 브랜치 (아래 규칙 참고)
- 커밋 목록과 변경된 파일 범위
- 변경의 핵심 의도 (무엇을 왜 바꿨는가)

**base 브랜치 결정 규칙** (CLAUDE.md 기준):

- `feature/issue-N` 형태 브랜치 → `feature/<spec>` 브랜치로
- 그 외 → `main`으로

---

## 2단계: PR 초안 작성

분석 결과로 제목과 본문 초안을 만든다.

**제목**: `<type>: <설명>` 형식, 70자 이내

- 허용 타입: `feat` · `fix` · `refactor` · `docs` · `test` · `chore` · `style`
- 커밋 목록 중 가장 핵심적인 변경 하나를 대표한다

**본문 형식**:

```
## Summary
- (핵심 변경사항 bullet 1~3개)

## Changed Files
**추가**
- `경로` — 역할 한 줄 설명

**수정**
- `경로` — 변경 내용 한 줄 설명

(변경 파일이 없는 분류는 생략한다)

## Test plan
- [ ] (검증 항목)
- [ ] (검증 항목)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## [GATE] 개발자 승인

초안을 다음 형식으로 제시하고 수정 여부를 확인한다.

```
PR 초안

제목: feat: 태그 삭제 기능 구현

본문:
## Summary
- useTagEditor에 removeTag 함수 추가
- TagInput 칩에 × 버튼 추가

## Test plan
- [ ] 칩의 × 클릭으로 태그 삭제 확인
- [ ] 삭제 후 나머지 태그 유지 확인

수정하려면 알려주세요. 그대로 진행하려면 확인해주세요.
```

승인 없이 push하거나 PR을 생성하지 않는다.

---

## 3단계: E2E 테스트 실행

```bash
npm run test:e2e
```

---

## [분기] E2E 결과 처리

### 통과 시 → 4단계로 진행

### 실패 시 → 중단 및 수정 안내

PR 생성을 중단하고 아래 절차를 출력한다.

```
E2E 테스트 실패 — PR 생성 중단

실패 원인을 먼저 수정해야 합니다.

① Trace Viewer로 실패 지점 확인
   npx playwright show-report

② 어느 레이어에서 깨졌는지 판별
   - API 응답 문제 → src/api/ 확인
   - 렌더링 문제   → 해당 컴포넌트 확인
   - 로직 문제     → 해당 훅 확인

③ 해당 레이어의 단위 테스트에 실패 케이스 추가
   /tdd-red N

④ 프로덕션 코드 수정으로 통과
   /tdd-green N

⑤ 수정 완료 후 다시 실행
   /create-pr

⚠ E2E 테스트 코드를 수정해 통과시키는 것은 금지
  — 근본 원인을 숨기는 것이며 실제 버그가 남습니다.
```

---

## 4단계: PR 생성

```bash
git push -u origin <현재 브랜치명>
```

```bash
gh pr create \
  --title "<승인된 제목>" \
  --base <base 브랜치> \
  --body "$(cat <<'EOF'
<승인된 본문>
EOF
)"
```

생성된 PR URL을 출력한다.

---

## 제약

- 개발자 승인 없이 push 또는 PR 생성 금지
- E2E 실패 시 중단 — E2E 코드 수정으로 우회 금지
- `--force` push 금지
- PR 제목 70자 초과 금지
