# 배포 가이드

## 🚀 빠른 시작 (로컬 개발)

### 1. 인프라 시작 (Docker)
```powershell
docker-compose up -d
```

### 2. 모든 서비스 시작
```powershell
.\scripts\start-all-services.ps1
```

또는 개별적으로:
```powershell
# User Service (포트 8082)
cd backend\user-service
.\mvnw.cmd spring-boot:run

# Audition Service (포트 8081)
cd backend\audition-service
.\mvnw.cmd spring-boot:run

# Media Service (포트 8083)
cd backend\media-service
.\mvnw.cmd spring-boot:run

# API Gateway (포트 8080)
cd backend\gateway
.\mvnw.cmd spring-boot:run
```

### 3. 프론트엔드 시작
```powershell
cd frontend\web
npm install
npm run dev
```

## 🌐 서비스 접속 주소

- **API Gateway**: http://localhost:8080
- **User Service**: http://localhost:8082
- **Audition Service**: http://localhost:8081
- **Media Service**: http://localhost:8083
- **Frontend**: http://localhost:3000

## 📦 프로덕션 빌드

### 1. 백엔드 빌드
```powershell
.\scripts\deploy.ps1
```

또는 개별적으로:
```powershell
cd backend\user-service
.\mvnw.cmd clean package -DskipTests

cd ..\audition-service
.\mvnw.cmd clean package -DskipTests

cd ..\media-service
.\mvnw.cmd clean package -DskipTests

cd ..\gateway
.\mvnw.cmd clean package -DskipTests
```

### 2. JAR 파일 실행
```powershell
# 각 서비스를 별도 터미널에서 실행
java -jar backend\user-service\target\user-service-1.0.0-SNAPSHOT.jar
java -jar backend\audition-service\target\audition-service-1.0.0-SNAPSHOT.jar
java -jar backend\media-service\target\media-service-1.0.0-SNAPSHOT.jar
java -jar backend\gateway\target\gateway-1.0.0-SNAPSHOT.jar
```

## ☁️ 클라우드 배포 (임시 서버)

### 옵션 1: Railway (무료 티어)
1. Railway.app에 가입
2. GitHub 저장소 연결
3. 각 서비스를 별도 서비스로 배포
4. 환경 변수 설정:
   - `SPRING_PROFILES_ACTIVE=production`
   - `DATABASE_URL` (Railway PostgreSQL)
   - `REDIS_URL` (Railway Redis)

### 옵션 2: Render (무료 티어)
1. Render.com에 가입
2. 각 서비스를 Web Service로 배포
3. PostgreSQL과 Redis를 별도 서비스로 생성
4. 환경 변수 설정

### 옵션 3: AWS EC2 (유료, 더 많은 제어)
1. EC2 인스턴스 생성
2. Docker 설치
3. docker-compose로 모든 서비스 실행
4. Nginx로 리버스 프록시 설정

## 🔧 환경 변수

### User Service
```yaml
SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/audition_db
SPRING_DATASOURCE_USERNAME: audition_user
SPRING_DATASOURCE_PASSWORD: audition_pass
JWT_SECRET: your-secret-key
JWT_EXPIRATION: 86400000
```

### Audition Service
```yaml
SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/audition_db
SPRING_DATASOURCE_USERNAME: audition_user
SPRING_DATASOURCE_PASSWORD: audition_pass
```

### Media Service
```yaml
SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/audition_db
SPRING_DATASOURCE_USERNAME: audition_user
SPRING_DATASOURCE_PASSWORD: audition_pass
```

### Gateway
```yaml
SPRING_CLOUD_GATEWAY_ROUTES[0].URI: http://localhost:8082
SPRING_CLOUD_GATEWAY_ROUTES[1].URI: http://localhost:8081
SPRING_CLOUD_GATEWAY_ROUTES[2].URI: http://localhost:8083
```

## 📝 배포 체크리스트

- [ ] 데이터베이스 마이그레이션 실행
- [ ] 환경 변수 설정
- [ ] JWT 시크릿 키 생성
- [ ] CORS 설정 확인
- [ ] 로그 레벨 설정
- [ ] 헬스 체크 엔드포인트 확인
- [ ] 프론트엔드 API URL 설정

## ✅ Railway 배포 확인

### 1. 스크립트로 확인
```powershell
# PowerShell
.\scripts\check-deployment.ps1 -GatewayUrl "https://your-gateway.railway.app"

# 또는 Batch 파일
scripts\check-deployment.bat "https://your-gateway.railway.app"
```

### 2. 브라우저에서 확인
1. `scripts/test-api.html` 파일을 브라우저에서 열기
2. Gateway URL 입력
3. 각 버튼 클릭하여 API 테스트

### 3. 수동 확인
각 서비스의 Public URL에 `/actuator/health` 추가:
- `https://your-gateway.railway.app/actuator/health`
- `https://your-user-service.railway.app/actuator/health`
- `https://your-audition-service.railway.app/actuator/health`
- `https://your-media-service.railway.app/actuator/health`

**예상 응답:**
```json
{
  "status": "UP"
}
```

자세한 내용은 [DEPLOYMENT_CHECK.md](docs/DEPLOYMENT_CHECK.md) 참고

## 🐛 문제 해결

### 포트 충돌
```powershell
# 포트 사용 확인
netstat -ano | findstr :8080
netstat -ano | findstr :8081
netstat -ano | findstr :8082
netstat -ano | findstr :8083
```

### 데이터베이스 연결 실패
```powershell
# PostgreSQL 확인
docker ps
docker exec -it audition-postgres psql -U audition_user -d audition_db
```

### 서비스 간 통신 실패
- Gateway의 라우팅 설정 확인
- 각 서비스의 포트 확인
- 방화벽 설정 확인

### Railway 배포 실패
- Railway 로그 확인 (각 서비스의 Logs 탭)
- 환경 변수 확인 (Settings → Variables)
- `application-production.yml` 파일 확인
- 데이터베이스 연결 정보 확인
