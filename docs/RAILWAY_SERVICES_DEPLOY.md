# Railway 서비스 배포 가이드

## 완료된 서비스
- ✅ Database (audition-db)
- ✅ User Service (user-service)

## 배포 예정 서비스
- 🔄 Gateway Service
- 🔄 Audition Service  
- 🔄 Media Service

---

## 1. Gateway Service 배포

### 사전 준비
- Gateway는 다른 서비스들의 URL을 알아야 함
- User Service가 먼저 배포되어 있어야 함

### Railway 환경 변수 설정

1. **SPRING_PROFILES_ACTIVE**
   ```
   production
   ```

2. **PORT** (Railway 자동 설정)
   - Railway가 자동으로 설정합니다

3. **서비스 URL 설정** (다른 서비스들이 배포된 후)
   ```
   USER_SERVICE_URL=https://user-service-production-7ba1.up.railway.app
   AUDITION_SERVICE_URL=https://audition-service-xxx.up.railway.app
   MEDIA_SERVICE_URL=https://media-service-xxx.up.railway.app
   ```

### 배포 방법
```bash
cd backend/gateway
railway link  # 또는 Railway 대시보드에서 GitHub 연결
railway up
```

### 확인
- Health Check: `https://gateway-xxx.up.railway.app/actuator/health`
- Gateway Routes: `https://gateway-xxx.up.railway.app/actuator/gateway/routes`

---

## 2. Audition Service 배포

### 사전 준비
- Database 연결 필요 (같은 PostgreSQL 사용)
- Redis 연결 필요 (선택 사항, 캐시용)
- JWT Secret이 User Service와 동일해야 함

### Railway 환경 변수 설정

1. **SPRING_PROFILES_ACTIVE**
   ```
   production
   ```

2. **Database 연결** (기존 Database와 동일)
   ```
   SPRING_DATASOURCE_URL=jdbc:postgresql://postgres.railway.internal:5432/railway
   SPRING_DATASOURCE_USERNAME=postgres
   SPRING_DATASOURCE_PASSWORD=[기존 DB 비밀번호]
   ```
   또는
   ```
   DATABASE_URL=postgresql://postgres:password@postgres.railway.internal:5432/railway
   ```

3. **JWT Secret** (User Service와 동일하게)
   ```
   JWT_SECRET=[User Service와 동일한 값]
   JWT_EXPIRATION=86400000
   ```

4. **Redis** (선택 사항)
   ```
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```
   > **참고**: Railway에서 Redis를 별도로 추가하거나, 없으면 localhost로 설정 (기능 제한)

5. **PORT** (Railway 자동 설정)

### SecurityConfig 확인
- `/actuator/**`가 `permitAll()`로 설정되어 있는지 확인
- User Service처럼 별도 SecurityFilterChain이 필요할 수 있음

### 배포 방법
```bash
cd backend/audition-service
railway link
railway up
```

### 확인
- Health Check: `https://audition-service-xxx.up.railway.app/actuator/health`
- Swagger UI: `https://audition-service-xxx.up.railway.app/swagger-ui.html`

---

## 3. Media Service 배포

### 사전 준비
- Database 연결 필요 (같은 PostgreSQL 사용)

### Railway 환경 변수 설정

1. **SPRING_PROFILES_ACTIVE**
   ```
   production
   ```

2. **Database 연결** (기존 Database와 동일)
   ```
   SPRING_DATASOURCE_URL=jdbc:postgresql://postgres.railway.internal:5432/railway
   SPRING_DATASOURCE_USERNAME=postgres
   SPRING_DATASOURCE_PASSWORD=[기존 DB 비밀번호]
   ```
   또는
   ```
   DATABASE_URL=postgresql://postgres:password@postgres.railway.internal:5432/railway
   ```

3. **PORT** (Railway 자동 설정)

### SecurityConfig 확인
- Media Service는 Security 설정이 필요할 수 있음
- 필요 시 User Service처럼 Actuator를 위한 별도 SecurityFilterChain 추가

### 배포 방법
```bash
cd backend/media-service
railway link
railway up
```

### 확인
- Health Check: `https://media-service-xxx.up.railway.app/actuator/health`

---

## 배포 순서 권장사항

1. **Database** ✅ (완료)
2. **User Service** ✅ (완료)
3. **Audition Service** (Database 사용, JWT 필요)
4. **Media Service** (Database 사용)
5. **Gateway Service** (모든 서비스 URL 필요)

---

## 공통 설정 사항

### Actuator Health Check
모든 서비스에서 `/actuator/health`가 작동하도록:
- `SecurityConfig`에서 `/actuator/**`를 `permitAll()`로 설정
- User Service처럼 별도 SecurityFilterChain 사용 권장

### Database 연결
- Railway 내부 네트워크: `postgres.railway.internal:5432`
- Public URL: Railway Database의 Connection String 사용

### 환경 변수 공유
- `JWT_SECRET`: User Service와 Audition Service에서 동일하게 사용
- Database 연결 정보: 모든 서비스에서 동일하게 사용

---

## 문제 해결

### 403 Forbidden on /actuator/health
- SecurityConfig에 Actuator 전용 SecurityFilterChain 추가 (User Service 참고)

### Database Connection Error
- Railway 환경 변수에서 `SPRING_DATASOURCE_*` 설정 확인
- 또는 `DATABASE_URL` 파싱을 위한 DatabaseConfig 확인

### Service Discovery Issue
- Gateway에서 다른 서비스 URL을 환경 변수로 받도록 설정
- Public URL을 정확히 설정했는지 확인
