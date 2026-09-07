# tag-catalog 초기 아이디어

## 배경

`apps/extension/lib/tag-catalog.ts`에 유형 태그 목록(핵심 11종 + 카테고리 14종, 총 25개)이
프론트엔드에 하드코딩되어 있다. `docs/decisions/tag-catalog-single-source-of-truth.md`에
"향후 백엔드 `GET /api/tags` 연동" 과제로 이미 예고되어 있던 작업이다.

## 담당 범위

이 이슈는 **백엔드 전용**이다. 이 프로젝트의 FE/BE 역할 분리 관례(참고:
`docs/features/problem-identification/issues.md`)에 따라, 프론트엔드가 이 API를
실제로 호출해 `lib/tag-catalog.ts`를 대체하는 작업(TagPicker/TagFilterPanel 연동,
id 타입 마이그레이션 등)은 별도 이슈로 프론트 담당자가 진행한다.

## 확정된 API 계약 (지은 작성, "유형 태그 API 명세서" v1.0)

### `GET /api/tags`

핵심 태그(11개) + 더보기 확장 영역(대분류별 소분류 태그, 14개) 총 25개를 한 번에 반환.

```
Response 200:
[
  { "id": integer, "name": string, "category": string }
]
```

- `category: "CORE"` → 핵심 태그, 카테고리 구분 없이 항상 플랫 노출
- `category: "자료구조" | "탐색·완전탐색" | "그래프" | "알고리즘설계기법" |
  "문자열알고리즘" | "수학" | "고급"` → "더보기" 클릭 시에만 노출, 섹션 제목으로 사용
- 전체 25개 태그 목록/이름/카테고리 매핑은 명세서 원문 참고 (프론트 기존
  `lib/tag-catalog.ts`의 `CORE_TAGS`/`TAG_CATEGORIES`와 태그 구성은 동일, id 체계만 다름)

### `POST /api/tags`

Upsert 패턴 (`/api/problems`와 동일). 이미 같은 이름의 태그가 있으면 새로 만들지 않고
기존 걸 그대로 반환한다.

```
Request:  { "name": string }
Response 201/200: { "id": integer, "name": string, "category": "CUSTOM" }
```

- 사용자가 직접 입력한 커스텀 태그를 생성/재사용하기 위한 API
- 새로 생성된 커스텀 태그는 `category`가 자동으로 `"CUSTOM"`으로 지정됨 (클라이언트가
  지정하는 값 아님, 요청 스키마에도 없음)
- upsert 매칭 기준(대소문자/공백 정규화 여부)은 명세서에 명시되지 않음 — 구현 단계에서
  정해야 할 세부사항

## 이미 정리된 팀 확정 필요 항목

원 명세서 "2. 팀 확정 필요 항목" 4가지 중:

1. **`/api/attempts`의 `tags` 필드 형식** — Attempt 저장 담당 팀원이 이미 "이름 문자열
   배열"로 확정(`["DFS", "그리디"]`). 이 태그 API의 응답 스키마(`id`/`name`/`category`)와는
   무관 — Attempt 쪽은 태그의 `name` 값만 뽑아 쓰면 됨.
2. **커스텀 태그 정규화 정책** — 프론트(`tag-input.ts`)에는 이미 trim + 대소문자 무시
   정규화가 구현되어 있음. 백엔드 `POST /api/tags`의 upsert 매칭도 동일 정책을 따를지는
   구현 단계에서 결정.
3. **태그 다중 선택 여부** — 프론트(`tag-toggle-group.tsx`)가 이미 `type="multiple"`로
   다중 선택 지원 중. 확정.
4. **커스텀 태그 재사용 여부** — `POST /api/tags`가 upsert + `category: "CUSTOM"`으로
   서버 카탈로그에 정식 등록하는 구조라, 재사용 가능하다는 쪽으로 확정.

## 이번 이슈에서 다뤄야 할 것 (가설)

- `Tag` 도메인 엔티티 + Repository
- `GET /api/tags` 컨트롤러/서비스
- `POST /api/tags` 컨트롤러/서비스 (upsert 로직)
- `SecurityConfig.java`에 `/api/tags/**` permitAll 추가 (본인이 직접 수정, 로그인
  담당자와 사전 조율)
- `SecurityConfig.java`에 CORS 설정 추가 (본인이 담당하기로 확정)

## Out of Scope (초안)

- 프론트엔드 연동 (`lib/tag-catalog.ts` 교체, UI 컴포넌트 수정) — 별도 이슈
- 태그 삭제/수정 API — 명세서에 없음
- 관리자 태그 관리 화면
