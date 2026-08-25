# ADR 002: 백엔드 개발 환경 및 코드 품질 규칙 결정

> **상태:** 확정  
> **결정일:** 2026-08-25  
> **작성자:** @young2z1

---

## 배경

Codit의 백엔드는 Java와 Spring Boot를 기반으로 개발한다.

팀원마다 개발 환경과 코드 작성 방식이 달라질 경우,
들여쓰기, import, 코드 스타일 등의 차이로 인해 코드 리뷰와 협업에 불필요한 비용이 발생할 수 있다.

따라서 프로젝트 초기 단계에서 다음 항목을 통일한다.

- Java 버전
- Spring Boot 버전
- 빌드 도구
- 코드 스타일 및 정적 분석 도구(Lint)
- 에디터의 기본 들여쓰기 규칙

---

## 결정 사항

| 항목 | 선택 |
|---|---|
| Java | **Java 17** |
| Spring Boot | **Spring Boot 4.0.8** |
| Build Tool | **Gradle** |
| Gradle DSL | **Groovy** |
| Lint / 정적 분석 | **Checkstyle** |
| 코드 스타일 | **Google Java Style 기반** |
| 들여쓰기 | **4 spaces** |
| 설정 파일 | `config/checkstyle/checkstyle.xml` |
| Editor 설정 | `.editorconfig` |

---

## 1. Java 17

### 결정

백엔드의 Java 버전은 **Java 17**로 통일한다.

### 결정 근거

**1. 안정적인 LTS 버전**

Java 17은 LTS(Long-Term Support) 버전으로 장기간 안정적으로 사용할 수 있다.

**2. 프로젝트에 필요한 기능을 충분히 제공**

현재 Codit의 규모와 기능을 고려하면 최신 Java 버전의 기능이 반드시 필요한 상황은 아니다.

Java 17만으로 Spring Boot 기반 REST API 서버를 구현하는 데 충분하다.

**3. 팀원의 학습 부담을 줄일 수 있음**

최신 Java 버전을 무조건 사용하는 것보다 팀원들이 익숙한 안정적인 버전을 사용하는 것이 현재 프로젝트에 적합하다.

---

## 2. Spring Boot 4.0.8

### 결정

Spring Boot 버전은 **4.0.8**로 통일한다.

Spring Initializr에서 생성 가능한 안정 버전 중 `4.0.8`을 사용한다.

### 결정 근거

- Snapshot 버전(`4.0.9-SNAPSHOT`, `4.1.2-SNAPSHOT` 등)은 제외
- Milestone 버전(`4.2.0-M1`)은 제외
- 팀 전체가 동일한 안정 버전을 사용하여 환경 차이를 방지
- 프로젝트 시작 시점에 사용 가능한 안정 버전으로 통일

> Spring Boot 버전은 프로젝트 진행 중 특별한 이유가 없다면 임의로 변경하지 않는다.

---

## 3. Gradle

### 결정

빌드 도구로 **Gradle**을 사용한다.

Gradle DSL은 **Groovy**를 사용한다.

### Gradle을 선택한 이유

**1. Spring Boot 프로젝트에서 널리 사용됨**

Spring Boot 프로젝트에서 Gradle과 Maven 모두 널리 사용되지만,
Gradle 역시 충분히 검증된 빌드 도구이다.

**2. 간결한 설정**

Gradle은 Maven의 XML 기반 설정에 비해 설정 파일을 비교적 간결하게 작성할 수 있다.

```gradle
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-webmvc'
}
```

**3. 팀의 프로젝트 구조와 잘 맞음**

Spring Boot 백엔드를 독립적인 Gradle 프로젝트로 관리하면서
프론트엔드의 pnpm workspace와 분리할 수 있다.

### Gradle DSL: Groovy

Gradle은 설정 파일을 작성하는 방식으로 Groovy DSL과 Kotlin DSL을 제공한다.

이번 프로젝트에서는 **Groovy DSL**을 선택한다.

```text
build.gradle
```

현재 팀의 Spring Boot 프로젝트가 Groovy 기반으로 생성되어 있으며,
별도의 Kotlin DSL 학습 비용을 추가하지 않고 프로젝트에 집중할 수 있다는 점을 고려했다.

---

## 4. Checkstyle

### 결정

Java 코드의 스타일 및 정적 검사를 위해 **Checkstyle**을 사용한다.

Gradle의 `checkstyle` 플러그인을 사용하여 프로젝트에 적용한다.

```gradle
plugins {
    id 'checkstyle'
}

checkstyle {
    toolVersion = '...'
}
```

### Checkstyle을 선택한 이유

**1. Java에 특화된 정적 분석 도구**

Checkstyle은 Java 소스 코드의 코딩 규칙을 검사하는 대표적인 도구이다.

예를 들어 다음과 같은 문제를 자동으로 검사할 수 있다.

- 들여쓰기
- 중복 import
- import 순서
- 중괄호 사용
- 클래스/메서드 작성 규칙
- 변수 및 메서드 이름 규칙
- 불필요한 코드 스타일 차이

**2. Google Java Style을 기반으로 규칙을 구성할 수 있음**

프로젝트에서 널리 알려진 Google Java Style을 기반으로 규칙을 구성하여
팀원 간 코드 스타일을 통일한다.

**3. Gradle과 쉽게 통합 가능**

백엔드가 Gradle 기반이므로 별도의 실행 환경을 추가하지 않고
Gradle task를 통해 검사할 수 있다.

```bash
./gradlew checkstyleMain
```

검사 결과 문제가 있으면 Gradle task가 실패하므로
잘못된 코드 스타일이 그대로 반영되는 것을 방지할 수 있다.

---

## 5. 코드 스타일

### 결정

Checkstyle 규칙은 **Google Java Style을 기반**으로 사용한다.

단, Codit 프로젝트에서는 들여쓰기를 **4칸**으로 설정한다.

```text
Google Java Style
+
4 spaces indentation
```

### 들여쓰기 예시

```java
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }
}
```

탭 문자를 사용하는 경우에도 에디터에서 **4개의 공백으로 변환하여 저장**하도록 설정한다.

---

## 6. EditorConfig

### 결정

팀원마다 사용하는 IDE가 다를 수 있으므로 `.editorconfig`를 프로젝트 루트에 두어
기본적인 파일 작성 규칙을 통일한다.

현재 설정은 다음과 같다.

```editorconfig
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.java]
indent_style = space
indent_size = 4

[*.md]
trim_trailing_whitespace = false
```

### 주요 설정

| 설정 | 의미 |
|---|---|
| `charset = utf-8` | 파일 인코딩 통일 |
| `end_of_line = lf` | 줄바꿈 방식 통일 |
| `indent_style = space` | 들여쓰기를 공백으로 통일 |
| `indent_size = 4` | Java 파일의 들여쓰기 4칸 |
| `insert_final_newline = true` | 파일 마지막에 줄바꿈 추가 |
| `trim_trailing_whitespace = true` | 줄 끝 불필요한 공백 제거 |

Java에서는 다음과 같이 적용된다.

```editorconfig
[*.java]
indent_style = space
indent_size = 4
```

---

## 7. Checkstyle 실행 방법

백엔드 디렉토리에서 다음 명령어로 검사를 실행한다.

```bash
./gradlew checkstyleMain
```

정상적으로 모든 규칙을 통과하면 다음과 같이 출력된다.

```text
BUILD SUCCESSFUL
```

규칙을 위반하면 어떤 파일의 몇 번째 줄에서 문제가 발생했는지 표시된다.

예:

```text
[ERROR] BackendApplication.java:8:9:
'method def modifier' has incorrect indentation level
```

따라서 코드를 작성한 후 Checkstyle 검사를 실행하여
팀의 코드 스타일 규칙을 만족하는지 확인한다.

---

## 8. 파일 구조

백엔드 관련 주요 설정 파일은 다음과 같이 관리한다.

```text
backend/
├── config/
│   └── checkstyle/
│       └── checkstyle.xml
│
├── gradle/
│   └── wrapper/
│
├── src/
│   ├── main/
│   │   └── java/
│   └── test/
│
├── build.gradle
├── settings.gradle
├── gradlew
└── gradlew.bat
```

프로젝트 루트의 에디터 설정은 다음과 같다.

```text
codit/
├── .editorconfig
├── apps/
├── packages/
└── backend/
```

---

## 트레이드오프 요약

| 항목 | 선택 | 이유 |
|---|---|---|
| Java | **17** | 안정적인 LTS + 현재 프로젝트에 충분 |
| Spring Boot | **4.0.8** | Snapshot/Milestone을 제외한 안정 버전 |
| Build Tool | **Gradle** | 간결한 설정 + Spring Boot와의 높은 호환성 |
| Gradle DSL | **Groovy** | 현재 생성된 프로젝트와 통일, 추가 학습 비용 감소 |
| Lint | **Checkstyle** | Java 특화 + Gradle 통합 + 코드 스타일 강제 |
| Code Style | **Google Java Style 기반** | 널리 사용되는 Java 코드 스타일 |
| Indentation | **4 spaces** | Java 프로젝트의 가독성과 팀 규칙 통일 |
| EditorConfig | **사용** | IDE가 달라도 기본 편집 규칙 통일 |

---

## 최종 결정

Codit 백엔드는 다음 환경을 기준으로 개발한다.

```text
Java 17
   ↓
Spring Boot 4.0.8
   ↓
Gradle (Groovy DSL)
   ↓
Checkstyle
   ↓
Google Java Style 기반 + 4 spaces
   ↓
.editorconfig로 에디터 설정 통일
```

팀원은 새로운 코드를 작성하거나 기존 코드를 수정할 때
위 규칙을 따르며, 백엔드 코드 작성 후 다음 명령어를 통해
Checkstyle 검사를 확인한다.

```bash
./gradlew checkstyleMain
```
