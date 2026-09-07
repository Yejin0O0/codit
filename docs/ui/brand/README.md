# Codit 브랜드 자산

이 폴더가 로고의 **Source of Truth**다. 제품에 들어가는 파일은 여기서 파생한다.

| 파일 | 내용 | 규격 | 용도 |
|------|------|------|------|
| `codit-logo-icon.png` | 마크만 (라운드 스퀘어 + 흰 기하학 C + 민트 체크) | 344×352, RGBA (투명 배경) | 앱/확장 아이콘, 파비콘의 원본 |
| `codit-logo-lockup.png` | 마크 + "Codit" 워드마크 | 1881×836, RGB | 문서·README·스토어 설명·랜딩 |

## 색 (픽셀 샘플, 근사)

| 요소 | 값 |
|------|-----|
| 아이콘 배경 그라데이션 | `#A5BEFA` (페리윙클) → `#C5BBFA` (라벤더), 대각 |
| 워드마크 그라데이션 | `#8FB5FB` (파랑 ~218°) → `#A193FA` (바이올렛 ~250°), 좌→우 |
| 그린 체크 | `#A7F8CE` ~ `#90E8B8` (파스텔 민트) |
| C 마크 | `#FFFFFF` (미세한 그림자·베벨) |

`--primary`는 워드마크의 **바이올렛 끝**(`#A193FA` 계열)을 기준으로 잡는다 — 로고에 충실하면서 SWEA 액센트 파랑(`#4590E3`, 212°)과 최대한 분리. 상세: [`../host-audit-swea.md`](../host-audit-swea.md).

## 사용 맵 — 어디에 어떤 형식으로

| 위치 | 무엇 | 형식 | 소스 | 상태 |
|------|------|------|------|------|
| 확장 아이콘 (`manifest.icons`, 툴바, 확장 관리, 스토어) | 마크만 | PNG 16/32/48/96/128 → `apps/extension/public/icon/` | `codit-logo-icon.png` 리사이즈 | ✅ 생성됨 (`pnpm dlx sharp-cli … resize`) |
| Extension Page 파비콘 (`popup/index.html`, `page/index.html`) | 마크만 | PNG | `public/icon/32.png` · `16.png` (확장 아이콘 재사용) | ✅ 연결됨 (전용 파비콘 파생본은 불필요 — 아이콘 세트로 충분) |
| `BrandHeader` (Extension Page 상단 — auth / history) | 마크 + "Codit" | **인라인 SVG** (`CoditMark withCheck`) + 그라데이션 텍스트 (워드마크) | 로고 트레이스 | ✅ 원호형 stroke C + 민트 체크 |
| `CollapsedTimer` pill (Shadow DOM, ~16px) | 마크만, 단색 | **인라인 SVG** (`CoditMark`), `currentColor` / `text-primary` | 로고 트레이스, 16px 판독되게 단순화 (그림자·베벨 제거) | ✅ 단색 C |
| 갤러리 | — | — | — | 삭제됨 (Storybook `Foundations/브랜드` 가 대체) |
| README / 기획 문서 | 락업 | PNG | `codit-logo-lockup.png` | — |
| 로딩·빈 화면 일러스트 | 마크 or 락업 | PNG / SVG | — | 범위 밖 (후속) |

### 원칙

- **제품 UI 안(BrandHeader·pill·갤러리)은 래스터 PNG를 쓰지 않는다.** Shadow DOM 격리 + "인라인 SVG only" 아키텍처 규칙([`../ui-architecture.md`](../ui-architecture.md)). 렌더된 로고의 3D 베벨·그림자·그라데이션은 16px에서 뭉개진다 → 평면 인라인 SVG로 트레이스한다.
- **확장 아이콘·파비콘·문서 이미지는 PNG.** 여기서는 렌더된 그라데이션 버전을 그대로 쓴다.
- 16px 툴바 아이콘은 소프트 그림자 때문에 프레임을 꽉 못 채운다 — 필요 시 16px 전용 평면 변형을 별도로 만든다(후속).
- 스토어 프로모 아트(512px+)가 필요하면 `codit-logo-icon.png`(344px)로는 부족 → 원본 제작자에게 고해상도 요청.

## 파생 명령 (참고)

```bash
# 확장 아이콘 5종 재생성
cd apps/extension
for s in 16 32 48 96 128; do
  pnpm dlx sharp-cli -i ../../docs/ui/brand/codit-logo-icon.png -o "public/icon/${s}.png" resize $s $s
done
```
