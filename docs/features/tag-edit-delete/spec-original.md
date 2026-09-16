# tag-edit-delete 초기 아이디어

## 배경

`tag-catalog` 기능(`GET /api/tags`, `POST /api/tags`)으로 태그 조회·등록(upsert)
API를 구현했다. 해당 PRD에서 "태그 삭제/수정 API"는 명시적으로 Out of Scope로
남겨두었다 (`docs/features/tag-catalog/prd.md` 4장 참고).

## 아이디어

사용자가 예전에 만든(등록한) 태그를 수정하거나 삭제할 수 있어야 한다.

## 참고

- 기존 `Tag` 엔티티: `id`, `name`, `normalizedName`(unique), `category`
- 기존 카테고리 값: `CORE`(11종, 시딩 데이터), 대분류 7종(14개 카테고리 태그, 시딩
  데이터), `CUSTOM`(사용자가 `POST /api/tags`로 생성)
- 기존 upsert 정규화 규칙: trim + 대소문자 무시
