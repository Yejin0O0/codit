---
name: mermaid-diagram
description: "프로젝트 구조를 분석하여 Mermaid 다이어그램 HTML을 생성하고 브라우저를 실행하여 시각화합니다. 컴포넌트 의존성, 아키텍처 구조, 상태 흐름을 시각화하고 싶을 때 반드시 이 스킬을 사용하세요. '구조 보여줘', '의존성 다이어그램', '아키텍처 시각화', '컴포넌트 관계' 등의 요청에도 적극적으로 적용하세요."
---

# mermaid-diagram

프로젝트의 `src/` 디렉토리를 분석하여 Mermaid 다이어그램이 담긴 HTML 파일을 생성하고 브라우저에서 즉시 열어라.

## 단계 1: src/ 분석

`src/` 디렉토리의 모든 `.ts` / `.tsx` 파일을 읽는다.

각 파일에서 다음을 추출한다:
- `import` 구문 → 컴포넌트 간 의존성 (외부 라이브러리 제외)
- `useState` / `useContext` / Context Provider 패턴 → 상태 소유 관계
- 파일 경로 → `api/` / `context/` / `components/` / `types/` 레이어 분류

추출한 관계로 두 가지 Mermaid 구문을 만든다:
- **의존성**: `graph TD` — 레이어별 `subgraph`로 묶고, import 방향으로 화살표 연결
- **상태 흐름**: `graph LR` — 상태를 소유한 컴포넌트와 소비하는 컴포넌트 간 흐름 표현

Mermaid 노드 레이블 작성 규칙 (파서 오류 방지):
- `|` 문자는 노드 레이블 안에 사용하지 않는다 (`null | string` → `null / string`)
- `[]` 기호는 노드 레이블 안에 사용하지 않는다 (`Note[]` → `Note 배열`)
- em dash(`—`)는 서브그래프 제목에 사용하지 않는다 (`—` → `-`)
- `error`, `title`, `content` 등 HTML/JS 예약어는 노드 ID로 사용하지 않는다 (접미사 `State` 등 추가)
- 노드를 엣지 연결 전에 subgraph 안에서 먼저 선언한다

## 단계 2: docs/architecture/index.html 생성

`docs/architecture/` 디렉토리가 없으면 생성한다.

아래 구조로 HTML 파일을 작성한다:

```
- Mermaid.js CDN: https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js
- 배경색: #1a1a1a (어두운 테마)
- 탭 UI: "컴포넌트 의존성" / "상태 흐름" 두 탭으로 구분
- Mermaid 초기화: startOnLoad: false, theme: 'dark'
- 탭 전환 시 렌더링:
    1. mermaid.initialize() 이후 DOMContentLoaded에서 활성 탭만 렌더링
    2. 탭 전환 시 대상 패널의 .mermaid 요소에서 data-processed 속성 제거 후 mermaid.run() 호출
    3. 원본 diagram 소스를 data-src에 보존하여 재렌더링 시 복원
```

## 단계 3: 브라우저 실행

OS를 감지하여 즉시 브라우저를 연다:

```bash
# macOS
open docs/architecture/index.html

# Linux
xdg-open docs/architecture/index.html
```

## 완료 보고

모든 단계가 완료되면 다음 메시지를 출력한다:

```
아키텍처 다이어그램이 브라우저에서 열렸습니다.
```
