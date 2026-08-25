# 백엔드 개발환경 초기 설정 가이드

> Codit 백엔드 개발을 시작하기 전에 필요한 Java 및 Spring Boot 개발환경 설정 가이드

---

## 1. 개발환경 구성

Codit 백엔드는 다음 환경을 사용한다.

| 항목 | 버전 |
|---|---|
| JDK | **17** |
| Spring Boot | **4.0.8** |
| Build Tool | **Gradle** |
| Gradle DSL | **Groovy** |
| IDE | **STS 4** |
| Lint | **Checkstyle** |

> Gradle은 프로젝트에 포함된 **Gradle Wrapper(`gradlew`)**를 사용하므로 별도의 Gradle 설치는 필요하지 않다.

---

# 2. JDK 17 설치

## 2-1. JDK 17 다운로드

JDK 17을 설치한다.

권장 배포판은 다음과 같다.

- Eclipse Temurin JDK 17
- Amazon Corretto 17
- Oracle JDK 17

팀에서는 동일한 JDK 배포판을 사용하는 것을 권장한다.

> JDK와 JRE를 혼동하지 않도록 주의한다.  
> Spring Boot 개발에는 **JDK(Java Development Kit)**가 필요하다.

---

# 3. JAVA_HOME 환경변수 설정

JDK를 설치한 후 Windows의 환경변수에 `JAVA_HOME`을 설정한다.

## 3-1. 환경 변수 창 열기

Windows 검색창에서

```text
환경 변수
```

를 검색한다.

**"시스템 환경 변수 편집" → "환경 변수"**를 선택한다.

---

## 3-2. JAVA_HOME 추가

"시스템 변수" 또는 "사용자 변수"에 다음 변수를 추가한다.

```text
변수 이름
JAVA_HOME
```

값은 **JDK 17이 설치된 폴더**를 지정한다.

예:

```text
C:\Program Files\Eclipse Adoptium\jdk-17.0.XX-hotspot
```

또는 설치한 JDK에 따라 경로가 다를 수 있다.

> 자신의 PC에서 실제 JDK 17이 설치된 경로를 사용해야 한다.

---

# 4. PATH 설정

환경 변수의 `Path`에 Java 실행 경로를 추가한다.

```text
%JAVA_HOME%\bin
```

예를 들어 다음과 같이 설정할 수 있다.

```text
JAVA_HOME
    ↓
C:\Program Files\Eclipse Adoptium\jdk-17.0.XX-hotspot

Path
    ↓
%JAVA_HOME%\bin
```

이렇게 하면 JDK 설치 경로가 변경되더라도 `JAVA_HOME`만 수정하면 된다.

---

# 5. Java 설치 확인

환경변수를 설정한 후 **기존에 열려 있던 Git Bash나 터미널은 종료하고 새로 실행한다.**

Git Bash에서 다음 명령어를 실행한다.

```bash
java -version
```

정상적으로 설정되었다면 Java 17이 표시된다.

예:

```text
openjdk version "17.0.XX"
```

또한 다음 명령어로 `JAVA_HOME`도 확인할 수 있다.

```bash
echo $JAVA_HOME
```

Windows Git Bash에서는 다음과 같이 표시될 수 있다.

```text
C:\Program Files\Eclipse Adoptium\jdk-17.0.XX-hotspot
```

---

# 6. Git 저장소 Clone

Codit 저장소를 Clone한다.

```bash
git clone <Codit GitHub Repository URL>
```

Clone 후 프로젝트 폴더로 이동한다.

```bash
cd codit
```

백엔드 디렉토리로 이동한다.

```bash
cd backend
```

---

# 7. Gradle Java 버전 확인

Codit은 Gradle Wrapper를 사용한다.

따라서 별도로 Gradle을 설치하지 않는다.

Windows에서는:

```bash
./gradlew -version
```

을 실행한다.

출력 결과에서 JVM이 Java 17인지 확인한다.

예:

```text
------------------------------------------------------------
Gradle 9.x
------------------------------------------------------------

JVM: 17.0.XX
```

---

# 8. Spring Boot 프로젝트 실행

STS에서 다음 프로젝트를 연다.

```text
codit/backend
```

Spring Boot 프로젝트가 정상적으로 인식되면 다음과 같은 구조를 확인할 수 있다.

```text
backend/
├── src/
├── gradle/
├── build.gradle
├── settings.gradle
├── gradlew
└── gradlew.bat
```

---

## 8-1. STS에서 실행

`BackendApplication.java`를 찾아 실행한다.

```text
src
└── main
    └── java
        └── com.codit.backend
            └── BackendApplication.java
```

`BackendApplication.java`를

**Run As → Spring Boot App**

으로 실행한다.

---

## 8-2. 정상 실행 확인

콘솔에 다음과 비슷한 메시지가 나오면 정상적으로 실행된 것이다.

```text
Tomcat started on port 8080
```

또는

```text
Started BackendApplication
```

Codit 백엔드의 기본 포트는 다음과 같다.

```text
http://localhost:8080
```

---

# 9. Checkstyle 확인

Codit은 Checkstyle을 사용하여 Java 코드 스타일을 검사한다.

백엔드 디렉토리에서 다음 명령어를 실행한다.

```bash
./gradlew checkstyleMain
```

정상적으로 설정되었다면:

```text
BUILD SUCCESSFUL
```

이 출력된다.

코드 스타일을 위반한 경우에는 오류가 발생하며,
위반한 파일과 줄 번호가 표시된다.

예:

```text
[ERROR] BackendApplication.java:8:9:
'method def modifier' has incorrect indentation level
```

이 경우 해당 위치의 코드를 프로젝트의 Checkstyle 규칙에 맞게 수정한다.

---

# 10. IDE 들여쓰기 설정

프로젝트 루트의 `.editorconfig`가 Java 파일의 기본 들여쓰기를 다음과 같이 지정한다.

```editorconfig
[*.java]
indent_style = space
indent_size = 4
```

따라서 Java 파일은 **4칸 공백 들여쓰기**를 사용한다.

### 주의

IDE에서 Tab 키를 눌렀을 때 실제 파일에 Tab 문자가 들어가면
Checkstyle에서 오류가 발생할 수 있다.

따라서 IDE에서 다음과 같이 설정하는 것을 권장한다.

```text
Tab → 4 spaces
```

즉, 화면에서 Tab을 눌러도 실제 파일에는 **공백 4개가 입력되도록** 설정한다.

---

# 11. 최종 확인

다음 항목이 모두 정상이라면 백엔드 개발환경 설정이 완료된 것이다.

- [ ] JDK 17 설치
- [ ] `JAVA_HOME` 설정
- [ ] `PATH`에 `%JAVA_HOME%\bin` 설정
- [ ] `java -version`에서 Java 17 확인
- [ ] Git 저장소 Clone
- [ ] STS에서 `backend` 프로젝트 정상 인식
- [ ] `./gradlew -version`에서 JVM 17 확인
- [ ] Spring Boot 정상 실행
- [ ] `./gradlew checkstyleMain` 성공
- [ ] Java 파일 들여쓰기 4 spaces 설정

---

# 문제 발생 시

## `java` 명령어를 찾을 수 없는 경우

```text
'java' is not recognized...
```

다음을 확인한다.

1. JDK 17이 정상적으로 설치되었는지 확인
2. `JAVA_HOME`이 JDK 설치 경로를 가리키는지 확인
3. `Path`에 `%JAVA_HOME%\bin`이 추가되어 있는지 확인
4. 기존 터미널을 종료하고 새 터미널을 실행

---

## Java 버전이 17이 아닌 경우

다음 명령어로 현재 Java 버전을 확인한다.

```bash
java -version
```

Java 8, 11, 21 등이 표시된다면 다른 Java가 PATH의 우선순위를 차지하고 있을 수 있다.

다음 명령어로 실제 실행되는 Java 경로를 확인한다.

```bash
where java
```

Windows에서 여러 Java 경로가 나온다면
환경변수 `Path`의 순서를 확인한다.

---

## Checkstyle이 실패하는 경우

```bash
./gradlew checkstyleMain
```

실행 후 `[ERROR]`가 표시되는 경우
오류 메시지에 표시된 파일과 줄 번호를 확인한다.

Checkstyle 설정 파일:

```text
backend/config/checkstyle/checkstyle.xml
```

---

## Gradle 관련 문제가 발생하는 경우

Codit은 시스템에 설치된 Gradle보다 프로젝트에 포함된 **Gradle Wrapper**를 우선 사용한다.

```bash
./gradlew build
```

Windows CMD에서는:

```cmd
gradlew.bat build
```

따라서 팀원마다 Gradle 버전이 달라지는 문제를 방지할 수 있다.

---

# 개발환경 구성 완료

최종적으로 다음 구조의 환경이 구성된다.

```text
Windows
│
├── JDK 17
│   └── JAVA_HOME
│
└── Codit Repository
    │
    └── backend
        │
        ├── Spring Boot 4.0.8
        ├── Gradle Wrapper
        ├── Checkstyle
        └── Java 17
```

이후 백엔드 개발자는 별도의 Java/Gradle 설정을 반복할 필요 없이
저장소를 Clone한 후 STS에서 `backend`를 열어 개발을 시작할 수 있다.
