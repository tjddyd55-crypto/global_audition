# 로컬 테스트 + Railway PostgreSQL 가이드

로컬에서 모든 서비스를 실행하고, Railway의 PostgreSQL만 사용하는 방법입니다.

## 📋 사전 준비

1. **Java 17** 설치 확인
2. **Node.js 18+** 설치 확인 (프론트엔드용)
3. **Railway 계정** 및 PostgreSQL 서비스 생성

## 1단계: Railway에서 PostgreSQL 생성

### 1-1. PostgreSQL 서비스 생성
1. Railway 대시보드 접속
2. "New +" → "Database" → "PostgreSQL" 선택
3. 서비스 이름: `audition-db` (또는 원하는 이름)
4. 생성 완료 대기

### 1-2. 데이터베이스 정보 확인
1. PostgreSQL 서비스 선택
2. **Variables** 탭에서 다음 정보 확인:
   - `DATABASE_URL` (예: `postgresql://postgres:password@host:port/railway`)
   - 또는 개별 변수:
     - `PGHOST`
     - `PGPORT`
     - `PGDATABASE`
     - `PGUSER`
     - `PGPASSWORD`

### 1-3. 연결 정보 변환
Railway의 `DATABASE_URL` 형식: `postgresql://user:password@host:port/database`

Spring Boot용 JDBC URL 형식: `jdbc:postgresql://host:port/database`

**변환 예시:**
```
Railway: postgresql://postgres:abc123@containers-us-west-123.railway.app:5432/railway
JDBC:    jdbc:postgresql://containers-us-west-123.railway.app:5432/railway
Username: postgres
Password: abc123
```

## 2단계: 로컬 환경 변수 설정

### 2-1. 환경 변수 파일 생성

프로젝트 루트에 `.env.local` 파일 생성:

```env
# Railway PostgreSQL 연결 정보
RAILWAY_DB_HOST=containers-us-west-123.railway.app
RAILWAY_DB_PORT=5432
RAILWAY_DB_NAME=railway
RAILWAY_DB_USER=postgres
RAILWAY_DB_PASSWORD=your-password-here

# 또는 전체 DATABASE_URL 사용
RAILWAY_DATABASE_URL=postgresql://postgres:password@host:port/railway
```

### 2-2. application-local.yml 파일 생성

각 서비스에 `application-local.yml` 파일 생성:

**backend/services/user-service/src/main/resources/application-local.yml:**
```yaml
spring:
  datasource:
    url: jdbc:postgresql://${RAILWAY_DB_HOST:localhost}:${RAILWAY_DB_PORT:5432}/${RAILWAY_DB_NAME:audition_db}
    username: ${RAILWAY_DB_USER:postgres}
    password: ${RAILWAY_DB_PASSWORD:}
    driver-class-name: org.postgresql.Driver
  
  jpa:
    hibernate:
      ddl-auto: update  # 개발용: update, 프로덕션: validate
    show-sql: true

server:
  port: 8082

jwt:
  secret: local-development-secret-key-minimum-32-characters-long
  expiration: 86400000

logging:
  level:
    root: INFO
    com.audition.platform: DEBUG
```

**backend/services/audition-service/src/main/resources/application-local.yml:**
```yaml
spring:
  datasource:
    url: jdbc:postgresql://${RAILWAY_DB_HOST:localhost}:${RAILWAY_DB_PORT:5432}/${RAILWAY_DB_NAME:audition_db}
    username: ${RAILWAY_DB_USER:postgres}
    password: ${RAILWAY_DB_PASSWORD:}
    driver-class-name: org.postgresql.Driver
  
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true

server:
  port: 8081

jwt:
  secret: local-development-secret-key-minimum-32-characters-long
  expiration: 86400000

logging:
  level:
    root: INFO
    com.audition.platform: DEBUG
```

**backend/services/media-service/src/main/resources/application-local.yml:**
```yaml
spring:
  datasource:
    url: jdbc:postgresql://${RAILWAY_DB_HOST:localhost}:${RAILWAY_DB_PORT:5432}/${RAILWAY_DB_NAME:audition_db}
    username: ${RAILWAY_DB_USER:postgres}
    password: ${RAILWAY_DB_PASSWORD:}
    driver-class-name: org.postgresql.Driver
  
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true

server:
  port: 8083

logging:
  level:
    root: INFO
    com.audition.platform: DEBUG
```

**backend/services/gateway/src/main/resources/application-local.yml:**
```yaml
server:
  port: 8080

spring:
  application:
    name: gateway
  cloud:
    gateway:
      routes:
        - id: user-service
          uri: http://localhost:8082
          predicates:
            - Path=/api/v1/auth/**
          filters:
            - StripPrefix=0
        
        - id: audition-service
          uri: http://localhost:8081
          predicates:
            - Path=/api/v1/auditions/**, /api/v1/applications/**, /api/v1/offers/**
          filters:
            - StripPrefix=0
        
        - id: media-service
          uri: http://localhost:8083
          predicates:
            - Path=/api/v1/videos/**
          filters:
            - StripPrefix=0
      
      globalcors:
        cors-configurations:
          '[/**]':
            allowedOrigins: "*"
            allowedMethods:
              - GET
              - POST
              - PUT
              - DELETE
              - OPTIONS
            allowedHeaders: "*"
            allowCredentials: true

logging:
  level:
    root: INFO
    com.audition.platform: DEBUG
```

## 3단계: 로컬 서비스 실행

### 3-1. 환경 변수 로드

PowerShell에서:
```powershell
# .env.local 파일에서 환경 변수 로드
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
    }
}
```

### 3-2. 서비스 실행

**방법 1: 스크립트 사용**
```powershell
# 환경 변수 로드 후
.\scripts\start-all-services.ps1
```

**방법 2: 개별 실행**
```powershell
# 터미널 1: User Service
cd backend\services\user-service
$env:SPRING_PROFILES_ACTIVE="local"
.\mvnw.cmd spring-boot:run

# 터미널 2: Audition Service
cd backend\services\audition-service
$env:SPRING_PROFILES_ACTIVE="local"
.\mvnw.cmd spring-boot:run

# 터미널 3: Media Service
cd backend\services\media-service
$env:SPRING_PROFILES_ACTIVE="local"
.\mvnw.cmd spring-boot:run

# 터미널 4: Gateway
cd backend\services\gateway
$env:SPRING_PROFILES_ACTIVE="local"
.\mvnw.cmd spring-boot:run
```

### 3-3. 프론트엔드 실행
```powershell
cd frontend\web
npm install
npm run dev
```

## 4단계: 접속 확인

- **API Gateway**: http://localhost:8080
- **User Service**: http://localhost:8082
- **Audition Service**: http://localhost:8081
- **Media Service**: http://localhost:8083
- **Frontend**: http://localhost:3000

## 5단계: 테스트

### 헬스 체크
```powershell
# Gateway
Invoke-WebRequest -Uri "http://localhost:8080/actuator/health"

# User Service
Invoke-WebRequest -Uri "http://localhost:8082/actuator/health"

# Audition Service
Invoke-WebRequest -Uri "http://localhost:8081/actuator/health"

# Media Service
Invoke-WebRequest -Uri "http://localhost:8083/actuator/health"
```

### API 테스트
```powershell
# 오디션 목록
Invoke-WebRequest -Uri "http://localhost:8080/api/v1/auditions"

# 비디오 목록
Invoke-WebRequest -Uri "http://localhost:8080/api/v1/videos"
```

## 🔧 문제 해결

### 데이터베이스 연결 실패
- Railway PostgreSQL의 `DATABASE_URL` 확인
- 방화벽 설정 확인 (Railway는 외부 접속 허용)
- 연결 정보가 올바른지 확인

### 포트 충돌
```powershell
# 포트 사용 확인
netstat -ano | findstr :8080
netstat -ano | findstr :8081
netstat -ano | findstr :8082
netstat -ano | findstr :8083
```

### 환경 변수 로드 실패
- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 환경 변수 이름이 올바른지 확인
- PowerShell 세션을 재시작

## ✅ 체크리스트

- [ ] Railway PostgreSQL 생성 완료
- [ ] 데이터베이스 연결 정보 확인
- [ ] `.env.local` 파일 생성
- [ ] `application-local.yml` 파일 생성 (각 서비스)
- [ ] 환경 변수 로드
- [ ] 모든 서비스 실행
- [ ] 프론트엔드 실행
- [ ] 헬스 체크 통과
- [ ] API 테스트 통과

## 📝 참고사항

- Railway PostgreSQL은 무료 플랜에서 사용 가능
- 외부에서 접속 가능하므로 로컬에서 연결 가능
- `ddl-auto: update`로 자동 스키마 생성 (개발용)
- 프로덕션에서는 `validate` 사용 권장
