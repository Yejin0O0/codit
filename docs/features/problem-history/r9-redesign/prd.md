# 문제풀이 목록 카드 재설계 — PRD (리디자인 브리프)

> Layer 2 R9. 에픽 #51 / 이슈 #100. base = R7(#98, Option C) 위 스택.
> `ProblemCard` **레이아웃**만 재설계 + 문제유형 태그에 색상 도입.

## 배경

R7 스파이크에서 프레임(Option C)과 함께 문제유형 태그 색상 + 목록 카드 구조도 미리
탐색했다. 개발자가 목록 카드는 Option 5(태그 우선)를 선택. 당시 `TagChipList`는
`Badge variant="secondary"`로 모든 태그를 동일한 회색 pill로 렌더해, 문제풀이 이력이
쌓일수록 어떤 유형을 많이/적게 풀었는지 한눈에 스캔하기 어려웠다.

## 사용자 스토리

- **US-1** 목록에서 카드를 훑어볼 때 태그 색으로 어떤 유형의 문제인지 먼저 스캔할 수 있다.
- **US-2** 태그 색이 이미 있는 결과 상태색(정답=초록/오답=빨강/보류=호박)과 헷갈리지 않는다.

## 결정 (스파이크에서 개발자 확정, 2026-09-16)

### 카드 구조 — Option 5(태그 우선)

`entrypoints/page/history/problem-list.stories.tsx`(스파이크, 이후 삭제)에 5개 구조
후보(1~5)를 실제 `HistoryView`(mock data) 위에 렌더해 비교:

| 안 | 설명 | 결과 |
|---|---|---|
| 1 | 현재 구조 + 색상 태그만 | 기각 |
| 2 | 좌측 색상 레일 (첫 태그로 스캔) | 기각 |
| 3 | 컴팩트 로우 (테이블형, 밀도 우선) | 기각 |
| 4 | 결과별 그룹 + 섹션 헤더 | 기각 |
| **5** | **태그 우선(유형이 첫 줄)** | **채택** |

기각 사유: 1은 색만 추가해 US-1 개선이 약함. 2는 태그가 여러 개일 때 "첫 태그"만
대표색이 되는 게 자의적. 3은 정보 밀도는 높지만 태그가 여러 개면 잘림. 4는 필터 탭과
기능이 중복되고 그룹 헤더가 한 화면에 너무 많아짐.

### 색상 매핑

앱이 이미 결과 상태색(success=정답/destructive=오답/warning=보류)을 쓰고 있어서 7개
백엔드 카테고리 전부를 서로 다른 색으로 구분하려 하면 상태색과 충돌하거나(dataviz
팔레트 8색 중 aqua/yellow/green/red 제외), 남은 hue 폭에 욱여넣은 조합은 매번
`validate_palette.js`의 normal-vision floor(ΔE≥15)를 못 넘었다 — 여러 조합을 시도해
확인. 최종적으로 검증기를 통과한 4개 hue 패밀리(blue/orange/violet/magenta)로 7개
카테고리를 그룹핑.

| 패밀리 | 카테고리 |
|---|---|
| blue | 자료구조 |
| orange | 탐색·완전탐색, 그래프 |
| violet | 알고리즘 설계 기법, 수학 |
| magenta | 문자열 알고리즘, 고급 |

**자체 리뷰로 수정된 부분**: 처음엔 CORE 태그에 `--accent`(파스텔 iris)를 재사용했는데,
실제 렌더 스크린샷을 보니 `--accent-foreground`(hue≈280°)가 violet 패밀리(hue≈258°)와
육안으로 거의 구분이 안 됐다(US-2 위반). violet 값 자체는 검증기 통과 값이라 그대로
두고, CORE를 filled `--primary`로 바꿔 톤(파스텔 vs filled) 자체를 다르게 만들었다.
CUSTOM(사용자 태그)은 `--secondary` 재사용.

## AC

- [x] `lib/tag-colors.ts` — `tagColorClass(tagId)` 순수 함수, `tag-catalog.ts` 기반
- [x] `TagChipList`가 카테고리별 색상 클래스를 적용 (칩 텍스트는 그대로 — color-alone 아님)
- [x] `ProblemCard` 레이아웃을 Option 5로 변경 — `ProblemListView`/필터 로직은 불변
- [x] `TagChipList`를 공유하는 `ProblemSummary`/`AttemptItem`(상세 화면)도 자동으로 색상 적용됨 확인
- [x] a11y: 색이 유일한 식별 수단이 아님(태그 이름 텍스트 항상 노출)
- [x] `typecheck` · `lint` · `test` · `build` · `storybook:build` green
- [x] CORE 태그 색이 카테고리 4색과 육안으로 구분됨 (자체 리뷰 스크린샷으로 확인)

## Out of Scope

- 문제 상세(회차 히스토리) 구조 변경 — R10 소관
- 새 카테고리 추가 시 색 배정 — 현재 7개 카테고리 기준 고정 매핑
