# 디자인 시스템 v1 — spec-fixed

> `/design-system` Phase 1 `[BLOCKED]` 답변. 재논의 불필요.

## Q1. 표면 방향 → **C. 토큰 계층 우선**

- 외형은 통일 라이트 (위젯·Extension Page 둘 다).
- 토큰을 **공통 베이스 + Surface 오버라이드 2계층**으로 구축.
  - 공통 베이스: `--background` `--foreground` `--primary` 등 semantic 값.
  - Surface 오버라이드: 위젯(`:host`) vs Extension Page(`:root`)에서 elevation·밀도·표면
    분리 방식이 다를 수 있음 (위젯은 SWEA 흰 배경 위 → 강한 그림자, 페이지는 자체 문서).
- 위젯 다크(v2)는 Surface 오버라이드 값 교체만으로 가능한 상태로 남겨둔다. **v1은 다크 미구현.**

## Q2. 재디자인 깊이 → **B. 레이아웃까지 재설계**

- `/design-system`은 **토큰 foundation + 로고**만 한다 (4a·4b·4c·4f). 컴포넌트 스킨(4d·4e) 스킵.
- 화면별 레이아웃·구성 재설계는 **화면별 `/fe-ui-design` 재실행 → TDD**. 별도 사이클, 이 스킬 밖.
- 따라서 v1 리스킨 GitHub 이슈 AC에서 "레이아웃 불변"은 **삭제**. 대신 "레이아웃 재설계는
  후속 이슈에서" 명시.

## Q3. C 마크 → **A. 라운드 stroke C + 체크** (옥타곤 형태 트레이스)

- 평범한 원호가 아니라 로고의 라운드 옥타곤 letterform을 stroke로 트레이스.
- 두꺼운 stroke(~3–3.5 / 24 viewBox), 라운드 캡, 오른쪽 열림, 민트 체크가 입구에 겹침.
- pill(16px)에서는 단색(`currentColor`/`--primary`), BrandHeader에서는 2색(primary C + mint 체크).
- 실제 path는 Phase 4f에서 만들어 승인.

## 확정 제약 (Phase 2~4에서 준수)

- semantic 토큰 **이름 유지**, 값만 변경.
- `--primary` hue ∉ [190°, 235°] (SWEA 파랑 `#4590E3` 회피).
- 에디터 보라 syntax(~290°) 회피 → 인디고~바이올렛(~255–265°).
- idle 위젯 저채도·무애니 — 강한 색은 상호작용 요소에만.
- 새 npm 의존성 없음. 인라인 SVG only.
