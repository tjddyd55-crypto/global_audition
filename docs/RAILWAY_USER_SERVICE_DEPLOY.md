# Railway User Service 배포 가이드

Railway 유료 플랜을 사용하여 User Service를 배포하는 방법입니다.

## 📋 사전 준비

1. ✅ Railway 계정 생성 및 유료 플랜 결제 완료
2. ✅ PostgreSQL 서비스 생성 완료 (audition-db)
3. ✅ GitHub 저장소 준비 완료

## 🚀 배포 단계

### 1단계: Railway에서 User Service 생성

1. **Railway 대시보드 접속**
   - https://railway.app 접속
   - 프로젝트 선택 (audition-db가 있는 프로젝트)

2. **"+ Create" 버튼 클릭**

3. **"GitHub Repo" 선택** (유료 플랜에서는 활성화됨)

4. **GitHub 저장소 선택 및 연결**
   - 저장소 선택
   - 필요시 권한 부여

5. **서비스 설정**
   - Service Name: `user-service`
   - Root Directory: `backend/user-service` ⚠️ **중요!**
   - Branch: `main` (또는 기본 브랜치)

### 2단계: 빌드 및 시작 명령 설정

**Settings → Build & Deploy** 섹션에서:

- **Build Command:** (비워두기 또는 자동 감지 사용)
  - Railway가 Maven 프로젝트를 자동으로 감지하여 빌드합니다
  - 수동 설정이 필요한 경우: `./mvnw clean package -DskipTests`

- **Start Command:**
  ```
  java -jar target/user-service-1.0.0-SNAPSHOT.jar
  ```

**참고:** Railway는 Maven 래퍼(`mvnw`)를 자동으로 감지하고 빌드합니다.

### 3단계: 환경 변수 설정

**Settings → Variables** 섹션에서 다음 환경 변수를 추가합니다:

#### 필수 환경 변수

```bash
SPRING_PROFILES_ACTIVE=production
DATABASE_URL=${{audition-db.DATABASE_URL}}
JWT_SECRET=your-random-secret-key-minimum-32-characters-long-here
JWT_EXPIRATION=86400000
```

#### 환경 변수 설명

1. **SPRING_PROFILES_ACTIVE**
   - 값: `production`
   - 프로덕션 프로파일 활성화

2. **DATABASE_URL**
   - 값: `${{audition-db.DATABASE_URL}}`
   - Railway가 자동으로 PostgreSQL 연결 문자열로 변환
   - `audition-db`는 PostgreSQL 서비스 이름입니다

3. **JWT_SECRET** ⚠️ **중요!**
   - 값: 최소 32자의 랜덤 문자열
   - 예시: `my-super-secret-jwt-key-minimum-32-characters-long`
   - **절대 공개하지 마세요!**

4. **JWT_EXPIRATION**
   - 값: `86400000` (24시간, 밀리초 단위)
   - JWT 토큰 만료 시간

#### 환경 변수 설정 방법

1. Variables 탭 클릭
2. "New Variable" 버튼 클릭
3. 변수 이름과 값 입력
4. "Add" 클릭

또는 한 번에 여러 변수 추가:
1. Variables 탭에서 "Raw Editor" 클릭
2. 다음 형식으로 입력:
   ```
   SPRING_PROFILES_ACTIVE=production
   DATABASE_URL=${{audition-db.DATABASE_URL}}
   JWT_SECRET=your-secret-key-here
   JWT_EXPIRATION=86400000
   ```

### 4단계: PostgreSQL 서비스 연결

**중요:** User Service가 PostgreSQL에 연결되도록 설정해야 합니다.

1. User Service의 Settings로 이동
2. "Connect to PostgreSQL" 또는 "Add Database" 클릭
3. `audition-db` PostgreSQL 서비스를 선택
4. 연결 완료

연결 후 `DATABASE_URL` 환경 변수가 자동으로 생성됩니다:
```
DATABASE_URL=${{audition-db.DATABASE_URL}}
```

### 5단계: 배포 시작

1. **Deploy 탭으로 이동**
2. **"Deploy" 버튼 클릭** (또는 자동 배포 활성화 시 Git 푸시 시 자동 배포)

**빌드 과정:**
- Maven 종속성 다운로드 (1-2분)
- Java 컴파일 및 패키징 (2-3분)
- Docker 이미지 빌드 (1-2분)
- 서비스 시작 (30초-1분)

**총 소요 시간:** 약 5-10분

### 6단계: 배포 확인

#### Health Check

배포 완료 후 다음 URL로 Health Check:

```
https://your-user-service.railway.app/actuator/health
```

**예상 응답:**
```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP",
      "details": {
        "database": "PostgreSQL",
        "validationQuery": "isValid()"
      }
    },
    "diskSpace": {
      "status": "UP"
    },
    "ping": {
      "status": "UP"
    }
  }
}
```

#### 서비스 URL 확인

1. Railway 대시보드 → User Service
2. Settings → Networking
3. "Generate Domain" 클릭 (자동 생성되거나)
4. Public URL 확인: `https://your-user-service.railway.app`

#### 로그 확인

1. Railway 대시보드 → User Service
2. Logs 탭 클릭
3. 다음 메시지 확인:
   - ✅ `Started UserServiceApplication in X.XXX seconds`
   - ✅ `Tomcat started on port(s): 8082`
   - ❌ 에러 메시지가 있다면 확인

## 🔧 문제 해결

### 배포 실패

**원인 1: 빌드 오류**
- Logs 탭에서 Maven 빌드 오류 확인
- `pom.xml` 의존성 문제 확인
- Build Command 확인

**원인 2: 환경 변수 누락**
- `JWT_SECRET`이 설정되었는지 확인 (최소 32자)
- `DATABASE_URL`이 설정되었는지 확인
- PostgreSQL 서비스가 연결되었는지 확인

**원인 3: 데이터베이스 연결 실패**
- PostgreSQL 서비스가 실행 중인지 확인
- `DATABASE_URL` 형식 확인
- Railway 대시보드에서 PostgreSQL 연결 상태 확인

### Health Check 실패

**404 Not Found:**
- Actuator 엔드포인트가 활성화되어 있는지 확인
- `application-production.yml`에서 `management.endpoints.web.exposure.include` 확인

**503 Service Unavailable:**
- 서비스가 아직 시작 중일 수 있음 (1-2분 대기)
- 로그에서 시작 오류 확인

**Database DOWN:**
- PostgreSQL 서비스 확인
- `DATABASE_URL` 환경 변수 확인
- Railway 대시보드에서 PostgreSQL 연결 확인

### 서비스가 시작되지 않음

1. **로그 확인:**
   - Railway 대시보드 → User Service → Logs
   - 마지막 에러 메시지 확인

2. **일반적인 원인:**
   - 포트 충돌 (Railway가 자동 처리하므로 드묾)
   - 환경 변수 오타
   - 데이터베이스 마이그레이션 실패

3. **해결 방법:**
   - 환경 변수 다시 확인
   - PostgreSQL 서비스 재시작
   - User Service 재배포

## 📝 체크리스트

배포 전 확인 사항:

- [ ] Railway 유료 플랜 활성화
- [ ] PostgreSQL 서비스 생성 및 실행 중
- [ ] GitHub 저장소 연결 완료
- [ ] Root Directory: `backend/user-service` 설정
- [ ] Start Command: `java -jar target/user-service-1.0.0-SNAPSHOT.jar` 설정
- [ ] `SPRING_PROFILES_ACTIVE=production` 설정
- [ ] `DATABASE_URL=${{audition-db.DATABASE_URL}}` 설정
- [ ] `JWT_SECRET` 설정 (최소 32자)
- [ ] `JWT_EXPIRATION=86400000` 설정
- [ ] PostgreSQL 서비스 연결 확인
- [ ] 배포 시작
- [ ] Health Check 통과 확인

## 🎯 다음 단계

User Service 배포가 완료되면:

1. **Audition Service 배포** (동일한 방법, Root Directory: `backend/audition-service`)
2. **Media Service 배포** (Root Directory: `backend/media-service`)
3. **Gateway 배포** (다른 서비스 URL 필요, Root Directory: `backend/gateway`)

각 서비스는 동일한 방법으로 배포하되, 환경 변수만 서비스별로 다릅니다.

자세한 내용은 [RAILWAY_SETUP.md](./RAILWAY_SETUP.md) 참고