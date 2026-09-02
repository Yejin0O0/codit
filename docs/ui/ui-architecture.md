# Codit UI Architecture

> Codit UI의 실행 환경과 장기 아키텍처 규칙을 정의한다.
> feature별 화면 설계는 각 `docs/features/{feature}/ui-design.md`가 담당한다.
> 이 문서는 규칙만 규정한다. 구체 폴더/파일 경로, 빌드 도구 설정, CSS 주입 구현 방식은 구현 단계에서 결정한다.

---

## 실행 환경

- Codit UI는 content script로 임의 웹페이지 위에 뜨는 **floating 위젯**이다.
- React는 **Shadow DOM(open)** 내부에 마운트한다.
- 위젯은 호스트 페이지와 DOM·스타일 경계를 공유하지 않는다.

---

## 레이어 구조 · import 규칙

```
feature UI  →  Codit 공용 조합  →  shadcn/ui 프리미티브  →  기반(디자인 토큰 · cn())
```

- import는 위 방향으로만 흐른다.
- feature 간 직접 참조 금지. 공유가 필요하면 **Codit 공용 조합** 레이어로 승격한다.
- 프리미티브 레이어는 상위 레이어를 참조하지 않는다.
- Shared UI는 세 그룹으로 분리한다.
  - **shadcn 프리미티브**: 라이브러리에서 가져와 레포가 소유(복사형). Shadow DOM 대응 패치를 직접 반영한다.
  - **Codit 공용 조합**: 2개 이상 feature가 공유하는 조합 컴포넌트.
  - **순수 유틸**: `cn()` 등.

---

## 스타일 아키텍처 원칙 (영구)

1. **디자인 토큰과 컴포넌트 CSS는 Shadow DOM 내부에서 정상 적용되어야 한다.**
   토큰은 Shadow Root 스코프에 존재한다. 문서 루트(`:root`)에만 존재하는 정의에 의존하지 않는다.
2. **위젯 스타일은 호스트 페이지의 스타일 상속에 의존하지 않는다.**
   타이포·색·크기 등 상속되는 속성은 위젯이 자체적으로 확정한다.
3. **Portal을 사용하는 오버레이 컴포넌트는 Shadow Root-aware 해야 한다.**
   Portal 대상이 Shadow Root 내부여야 스타일이 유지된다.
4. **위젯은 호스트 테마와 독립적으로 자체 테마를 확정한다.**
   호스트 페이지의 라이트/다크 설정에 흔들리지 않는다.
5. **빌드 시스템은 유틸리티/토큰 CSS를 Shadow DOM에 주입 가능한 형태로 컴파일할 수 있어야 한다.**

---

## Shared UI 위치 원칙

| 그룹 | 성격 | 수정 주체 |
|------|------|----------|
| shadcn 프리미티브 | 라이브러리 복사본, 레포 소유 | shadcn 도구 + Shadow DOM 패치 |
| Codit 공용 조합 | 크로스-feature 조합 컴포넌트 | 직접 작성 |
| 순수 유틸 | 로직/헬퍼 | 직접 작성 |

승격 규칙: feature 2곳 이상에서 필요해지면 feature 로컬 → Codit 공용 조합으로 승격한다.

---

## CSS 주입 방식

- CSS는 Shadow Root 내부에 주입한다. 구체 방식(수동 주입 / 프레임워크 헬퍼)은 구현 단계에서 결정한다.
- 다크모드: v1은 고정 라이트 테마. `.dark` variant는 라이브러리 호환용으로만 선언한다.

---

## 실행 환경 · 2종 Surface

Codit UI는 두 Surface를 가진다. (첫 문서화: auth / problem-history feature)

| Surface | 환경 | 프레임 | 폭 | 테마 | 첫 사용 Feature |
|---------|------|--------|-----|------|----------------|
| Floating Widget | content script, Shadow DOM(open) | `CoditWidget` | 320px 고정 | 고정 라이트 | timer |
| Extension Page | 확장 전용 페이지(브라우저 탭), 자체 HTML 문서 | `ExtensionPageShell` | 중앙 정렬 컨테이너 (feature별 max-width) | 고정 라이트 | auth / problem-history |

- Extension Page는 자체 HTML 문서다. Shadow DOM 주입·320px 폭 제약·`:root → :host` 치환이 **적용되지 않는다.**
- 단, 디자인 토큰·shadcn 프리미티브·레이어 import 규칙은 두 Surface에 **동일하게** 적용한다.
- Surface 간 컴포넌트 공유가 필요하면 Codit 공용 조합으로 승격한다 (기존 승격 규칙 동일).
- 진입점(toolbar action 등)·manifest 구성은 구현 단계 기술 결정으로 남긴다. 설계 단계에서는 "어떤 화면이 어떤 Surface에 산다" 까지만 확정한다.
- Auth Gate는 Surface별로 독립이다. Extension Page의 비로그인/로그인 분기가 Floating Widget(Timer)의 동작을 강제하지 않는다.

---

## Design Token Scope · Surface 공유 원칙

Design Token의 **semantic Source of Truth는 Floating Widget과 Extension Page가 공유한다.**
**Scope만** Surface에 따라 다르다.

| Surface | Token Scope |
|---------|-------------|
| Floating Widget | Shadow DOM 의 `:host` scope |
| Extension Page | 일반 document 의 `:root` scope |

- 두 Surface에서 **별도의 독립적인 token set을 만들지 않는다.**
- 동일 semantic token(`--background` `--foreground` `--primary` `--muted` `--border` `--ring` `--card` `--success` `--warning` `--destructive` `--radius` 등)을 각 Surface scope에 적용한다.
- 구체적인 CSS 파일 구성·주입 방식(공유 토큰 파일 / 빌드 처리 / `:root ↔ :host` 치환 범위 등)은 **구현 단계에서 결정한다.**
