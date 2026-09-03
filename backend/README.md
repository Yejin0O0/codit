# Codit Backend

Spring Boot 4 (Java 17) REST API 서버.

## 사전 준비

- JDK 17 (`java -version` 으로 확인)
- Docker Desktop 실행 중

## 로컬 실행

```bash
cd backend

# 1. PostgreSQL 컨테이너 시작
docker compose up -d

# 2. 서버 실행
./gradlew bootRun
```

- API 서버: http://localhost:8080
- **API 문서 (Swagger UI): http://localhost:8080/swagger-ui.html**
- OpenAPI JSON: http://localhost:8080/v3/api-docs

프론트엔드는 이 Swagger UI 를 기준으로 연동한다. 문서는 컨트롤러 코드에서 자동 생성되므로 별도 관리 파일이 없다.

## DB

| 항목 | 로컬 | 배포 |
|---|---|---|
| PostgreSQL | `docker compose` (docker-compose.yml) | AWS RDS |
| 접속 정보 | 기본값 (codit / codit / localhost:5432) | 환경변수 `DB_URL` `DB_USERNAME` `DB_PASSWORD` |

스키마는 현재 `spring.jpa.hibernate.ddl-auto: update` 로 엔티티에서 자동 생성한다. 배포 전 Flyway 로 전환 예정.

```bash
docker compose down      # 컨테이너 중지 (데이터 유지)
docker compose down -v    # 데이터까지 삭제 후 초기화
```

## 테스트

```bash
./gradlew test        # 단위/슬라이스 테스트 (인메모리 H2, Docker 불필요)
./gradlew build       # 테스트 + checkstyle + jacoco 커버리지
```

커버리지 리포트: `build/reports/jacoco/test/html/index.html`

## 코드 스타일

Google Java Style 기반 + 4 spaces. 커밋 전 `./gradlew checkstyleMain` 확인.
자세한 규칙은 [docs/decisions/002-backend-development-environment.md](../docs/decisions/002-backend-development-environment.md).
