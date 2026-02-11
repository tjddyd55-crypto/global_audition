# 테스트 실행 가이드

## 🚀 빠른 시작

### Windows PowerShell에서 실행

#### 방법 1: 스크립트 사용 (가장 쉬움)

**PowerShell 실행 정책 오류가 발생하는 경우:**

```powershell
# 프로젝트 루트에서
cd audition-platform

# 방법 A: 실행 정책을 임시로 변경 (권장)
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
.\scripts\run-all-tests.ps1

# 방법 B: 실행 정책 없이 직접 실행
powershell -ExecutionPolicy Bypass -File .\scripts\run-all-tests.ps1

# 방법 C: 조용한 모드
powershell -ExecutionPolicy Bypass -File .\scripts\run-all-tests-quiet.ps1
```

**참고**: `Set-ExecutionPolicy -Scope Process`는 현재 PowerShell 세션에만 적용되며, 시스템 설정을 변경하지 않습니다.

#### 방법 2: 개별 서비스 테스트

**백엔드 테스트:**

```powershell
# 1. Audition Service 테스트
cd backend\services\audition-service
.\mvnw.cmd test
# 또는 Maven이 설치되어 있다면
mvn test

# 2. User Service 테스트
cd ..\user-service
.\mvnw.cmd test
# 또는
mvn test

# 3. Media Service 테스트
cd ..\media-service
.\mvnw.cmd test
# 또는
mvn test
```

**프론트엔드 테스트:**

```powershell
cd frontend\web
npm install  # 처음 한 번만
npm test
```

## 📍 테스트 실행 위치

### 백엔드 테스트

각 서비스의 루트 디렉토리에서 실행:

```
audition-platform/
└── backend/
    ├── services/
    │   ├── audition-service/  ← 여기서 실행
    │   └── mvnw.cmd test
    │   ├── user-service/      ← 여기서 실행
    │   └── mvnw.cmd test
    │   └── media-service/     ← 여기서 실행
    │       └── mvnw.cmd test
    └── pom.xml            ← (멀티모듈) `mvn test` 가능
```

### 프론트엔드 테스트

```
audition-platform/
└── frontend/
    └── web/  ← 여기서 실행
        └── npm test
```

## 🛠️ IDE에서 실행

### IntelliJ IDEA

1. 프로젝트 열기
2. `src/test/java` 폴더로 이동
3. 테스트 클래스 열기 (예: `AuditionServiceTest.java`)
4. 테스트 메서드 옆의 ▶ 버튼 클릭
   - 또는 `Ctrl+Shift+F10` (Windows)
   - 또는 `Cmd+Shift+R` (Mac)

**전체 테스트 실행:**
- 프로젝트 루트 우클릭 → `Run 'All Tests'`
- 또는 `Ctrl+Shift+F10` → `Run All Tests`

### Visual Studio Code

1. Java Extension Pack 설치
2. 테스트 파일 열기
3. 테스트 메서드 위에 나타나는 `Run Test` 링크 클릭
4. 또는 `Ctrl+Shift+P` → `Java: Run Tests`

### Eclipse

1. 테스트 클래스 우클릭
2. `Run As` → `JUnit Test`
3. 또는 `Alt+Shift+X, T`

## 📊 테스트 결과 확인

### 백엔드 (Maven)

테스트 실행 후 콘솔에 결과가 표시됩니다:

```
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

상세 리포트는 다음 위치에 생성됩니다:
- `target/surefire-reports/` - 테스트 리포트
- `target/site/jacoco/` - 커버리지 리포트 (JaCoCo 사용 시)

### 프론트엔드 (Jest)

테스트 실행 후:

```
PASS  src/components/__tests__/AuditionCard.test.tsx
  ✓ should render audition title
  ✓ should render category label

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
```

커버리지는 `coverage/` 폴더에 HTML로 생성됩니다.

## 🔧 문제 해결

### Maven Wrapper가 없는 경우

```powershell
# Maven이 설치되어 있다면
mvn wrapper:wrapper

# 또는 직접 Maven 사용
mvn test
```

### Maven이 설치되어 있지 않은 경우

1. Maven 설치: https://maven.apache.org/download.cgi
2. 또는 IntelliJ IDEA의 내장 Maven 사용

### Node.js가 없는 경우

1. Node.js 설치: https://nodejs.org
2. 설치 확인: `node --version`, `npm --version`

### 테스트가 실패하는 경우

1. **의존성 다운로드**:
   ```powershell
   mvn clean install
   # 또는
   npm install
   ```

2. **포트 충돌 확인**: 다른 서비스가 같은 포트 사용 중인지 확인

3. **데이터베이스**: 테스트는 H2 인메모리 DB를 사용하므로 별도 설정 불필요

## 💡 팁

### 특정 테스트만 실행

**Maven:**
```powershell
# 특정 테스트 클래스만
mvn test -Dtest=AuditionServiceTest

# 특정 메서드만
mvn test -Dtest=AuditionServiceTest#shouldCreateAudition
```

**Jest:**
```powershell
# 특정 파일만
npm test -- AuditionCard.test.tsx

# 패턴 매칭
npm test -- --testNamePattern="should render"
```

### Watch 모드 (자동 재실행)

**프론트엔드:**
```powershell
npm run test:watch
```

파일을 저장하면 자동으로 테스트가 재실행됩니다.

## 📝 예제

### 전체 테스트 실행 예제

```powershell
# 프로젝트 루트에서
cd audition-platform

# 스크립트 실행
.\scripts\run-all-tests.ps1
```

또는 수동으로:

```powershell
# 1. Audition Service
cd backend\services\audition-service
mvn test
cd ..\..

# 2. User Service  
cd backend\services\user-service
mvn test
cd ..\..

# 3. Media Service
cd backend\services\media-service
mvn test
cd ..\..

# 4. Frontend
cd frontend\web
npm test
```
