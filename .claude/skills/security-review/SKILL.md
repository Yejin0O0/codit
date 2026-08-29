---
name: security-review
description: >
  커밋 전 타입 오류와 보안 취약점을 점검하고 결과를 분류하는 스킬.
  "/security-review N", "보안 점검", "타입 오류 확인", "취약점 스캔",
  "커밋 전 점검", "audit 실행", "tsc 확인", "보안 취약점 확인해줘",
  "배포 전 점검", "refactor 끝났는데 점검해줘" 등의 요청에
  반드시 이 스킬을 사용하세요. 이슈 번호를 받아 타입 체크, 의존성 취약점,
  .env 노출 여부를 스캔하고 결과를 심각도별로 분류한 뒤
  개발자 승인 하에 즉시 수정 필요 항목만 처리합니다.
---

# Security Review

커밋 전에 타입 오류와 보안 취약점을 점검한다.
발견된 항목을 심각도별로 분류해 개발자가 무엇을 지금 고쳐야 하고, 무엇을 나중에 봐도 되는지 판단할 수 있게 한다.
스캔 결과를 직접 수정하는 것보다 정확한 분류와 보고가 더 중요하다 — 과도한 수정이 놓친 취약점보다 더 큰 문제를 만들 수 있다.

```
타입 오류 수집 (pnpm typecheck)
    + pnpm 취약점 수집 (pnpm audit)
    + .env 노출 여부 확인 (grep)
    + Gradle 의존성 취약점 수집 (./gradlew dependencies)
    + manifest.json permissions 감사 (grep + 수동 검토)
    + 빌드 아웃풋 시크릿 노출 확인 (grep)
    ↓ 심각도 분류 → 개발자 보고
    ↓ [GATE] 개발자 승인
    ↓ 즉시 수정 필요 항목만 처리
    ↓ 재스캔 → 클린 상태 확인
```

---

## 시작 전: 입력 확인

- **이슈 번호**: `$ARGUMENTS`에서 추출. 없으면 질문한다.

---

## 1단계: 타입 오류 수집

```bash
pnpm typecheck 2>&1
```

오류가 없으면 "타입 오류 없음"으로 기록한다.
오류가 있으면 파일명, 줄 번호, 오류 메시지를 목록으로 수집한다.

---

## 2단계: 의존성 취약점 수집

```bash
pnpm audit 2>&1
```

취약점이 없으면 "취약점 없음"으로 기록한다.
취약점이 있으면 패키지명, 심각도(critical/high/moderate/low), 설명을 수집한다.

`pnpm audit --fix` 후 메이저 버전 강제 업그레이드는 예기치 않은 breaking change를 유발할 수 있으므로 사용하지 않는다.

---

## 3단계: .env 노출 여부 확인

`.env` 파일의 변수명이 `src/` 코드에서 하드코딩된 문자열로 직접 사용되고 있는지 확인한다.

```bash
# .env 파일이 있는 경우
grep -r "process\.env\." src/ --include="*.ts" --include="*.tsx" 2>/dev/null
```

`process.env.VITE_` 같은 공개 환경 변수는 의도된 패턴이다. 비밀 키나 토큰이 코드에 직접 문자열로 박혀 있는 경우만 문제로 분류한다.

---

## 4단계: Gradle 의존성 취약점 수집

백엔드 Java 의존성의 취약점을 확인한다.

```bash
cd backend && ./gradlew dependencies --configuration runtimeClasspath 2>&1 | head -100
```

OWASP Dependency-Check 플러그인이 설정되어 있으면 실행한다:

```bash
cd backend && ./gradlew dependencyCheckAnalyze 2>&1
```

플러그인이 없으면 주요 의존성 버전을 수동으로 확인하고 알려진 CVE가 있는지 점검한다.
취약점이 없으면 "Gradle 취약점 없음"으로 기록한다.

---

## 5단계: manifest.json permissions 감사

익스텐션의 `apps/extension/public/manifest.json`(또는 `wxt.config.ts`의 manifest 설정)을 읽어
`permissions`와 `host_permissions`를 검토한다.

```bash
grep -A 20 '"permissions"' apps/extension/public/manifest.json 2>/dev/null
grep -A 20 'manifest' apps/extension/wxt.config.ts 2>/dev/null
```

**과도한 권한 신호:**
- `<all_urls>` 또는 `*://*/*` — 모든 사이트 접근. 실제 필요한 도메인으로 좁힐 수 있는지 확인
- `tabs` — 탭 URL/제목 접근. 실제로 쓰는지 확인
- `history`, `bookmarks`, `downloads` — 민감한 권한. 사용 여부 확인
- `webRequest` + `<all_urls>` 조합 — 모든 네트워크 요청 가로채기

각 권한마다 "실제로 사용하는가"를 코드베이스에서 확인한다:

```bash
grep -r "chrome\.\(tabs\|history\|bookmarks\|downloads\|webRequest\)" apps/extension/entrypoints/ 2>/dev/null
```

사용하지 않는 권한은 "즉시 수정 필요"로 분류한다.

---

## 6단계: 빌드 아웃풋 시크릿 노출 확인

익스텐션 빌드 아웃풋(`.output/`)에 API key, 토큰, 비밀 값이 포함됐는지 확인한다.

```bash
grep -r "sk-\|Bearer \|api_key\|apiKey\|secret\|password\|token" .output/ --include="*.js" 2>/dev/null | grep -v "node_modules"
```

환경 변수로 주입된 값이 번들에 포함됐는지 확인한다:

```bash
# .env에 정의된 변수명 추출 후 빌드 아웃풋에서 검색
grep -v "^#" apps/extension/.env 2>/dev/null | cut -d= -f1 | while read var; do
  grep -r "$var" .output/ --include="*.js" 2>/dev/null
done
```

`.output/` 디렉터리가 없으면 이 단계를 건너뛴다.
공개용 `VITE_` 환경 변수는 의도된 패턴이므로 무시 가능으로 분류한다.

---

## 7단계: 심각도 분류 및 보고

수집된 모든 항목을 아래 세 가지로 분류해 개발자에게 보고한다.
판단이 애매한 항목은 "무시 가능"보다 "권장 수정"으로 올려두는 것이 안전하다.

### 분류 기준

**즉시 수정 필요** — 지금 고치지 않으면 빌드가 실패하거나 실제 보안 위험이 있는 항목
- TypeScript 컴파일 오류 (빌드 실패)
- npm audit의 critical / high 취약점 (직접 사용하는 패키지)
- Gradle 의존성의 critical / high CVE (런타임 classpath)
- API 키, 비밀 토큰이 소스 코드 또는 빌드 아웃풋에 하드코딩된 경우
- manifest.json에 실제로 사용하지 않는 민감한 권한 (`<all_urls>`, `webRequest` 등)

**권장 수정** — 당장 위험하지 않지만 방치하면 코드 품질이 저하되는 항목
- npm audit의 moderate 취약점
- Gradle 의존성의 moderate CVE
- `any` 타입 남용 같은 타입 안전성 약화 패턴 (tsc는 통과하지만 의도적 타입 회피)
- manifest.json에 사용하지 않는 낮은 위험 권한 (`tabs`, `history` 등)

**무시 가능** — 알려진 false positive 또는 프로젝트에서 의도된 패턴
- npm audit / Gradle의 low 취약점 (개발 의존성, 실제 공격 벡터 없음)
- `VITE_` 접두사 공개 환경 변수 노출 (의도된 클라이언트 사이드 변수)
- 테스트 전용 패키지의 취약점
- manifest.json의 실제로 사용 중인 권한

### 보고 형식

```
타입 오류
  즉시 수정 필요 (N건)
    src/components/UserForm.tsx:34 — 'string | undefined' 형식은 'string'에 할당 불가
  권장 수정 (0건)
  무시 가능 (0건)

의존성 취약점
  즉시 수정 필요 (0건)
  권장 수정 (1건)
    moderate — nth-check < 2.0.1 (devDependency, 빌드 도구 내부)
  무시 가능 (2건)
    low — ...

.env 노출
  즉시 수정 필요 (0건)
  무시 가능 (1건)
    VITE_API_URL — 공개 환경 변수, 의도된 패턴
```

---

## [GATE] 개발자 승인 대기

보고 후 개발자가 확인하고 처리 범위를 결정할 때까지 기다린다.
개발자가 "즉시 수정 필요" 항목 중 일부를 보류하거나 "권장 수정" 항목을 추가로 처리하도록 지시할 수 있다.
승인 없이 코드를 수정하지 않는다.

---

## 8단계: 승인된 항목 처리

승인된 항목을 **하나씩** 처리한다.

타입 오류는 원인을 파악한 뒤 최소한의 변경으로 수정한다. 타입을 `any`로 우회하는 것은 오류를 숨기는 것이지 수정이 아니다.

취약점은 `pnpm audit --fix`(force 없이)로 안전한 범위 내 업그레이드를 시도한다:
```bash
pnpm audit --fix
```

fix 후 반드시 테스트를 실행해 회귀가 없는지 확인한다:
```bash
pnpm --filter @codit/extension test
```

테스트가 깨지면 즉시 롤백하고 개발자에게 보고한다.

---

## 9단계: 재스캔 → 클린 상태 확인

처리 완료 후 1~6단계를 다시 실행해 "즉시 수정 필요" 항목이 모두 해소됐는지 확인한다.

남은 항목이 있으면 개발자에게 보고하고 다음 단계를 협의한다.

---

## 최종 보고 형식

```
Security Review 결과 — 이슈 N

처리됨 (2건)
  타입 오류 — src/components/UserForm.tsx:34 수정
  취약점    — nth-check 2.1.1로 업그레이드 (npm audit fix)

보류됨 (1건)
  moderate  — 개발자 판단으로 다음 스프린트 처리 예정

클린 상태: typecheck ✅  |  pnpm audit critical/high 없음 ✅  |  .env 노출 없음 ✅  |  Gradle CVE 없음 ✅  |  manifest 권한 적정 ✅  |  빌드 아웃풋 시크릿 없음 ✅
```

---

## 제약

- **판단이 필요한 항목은 개발자 승인 후 수정** — 스캔 결과가 맞더라도 문맥을 모르면 잘못된 수정을 할 수 있다.
- **테스트 파일 수정 금지** — 타입 오류가 테스트 파일에 있어도 테스트 코드는 건드리지 않는다. 개발자에게 보고한다.
- **`npm audit fix --force` 금지** — 메이저 버전 강제 업그레이드는 예측 불가능한 breaking change를 유발한다.
- **`./gradlew dependencyCheckAnalyze` 결과는 보고만** — 직접 의존성 버전을 올리기 전 개발자 승인을 받는다.
- **manifest.json 권한 제거 전 코드 확인 필수** — 실제로 사용 중인 권한을 제거하면 익스텐션이 동작하지 않는다.
