# Railway 배포 설정 가이드

Railway에 배포할 때 필요한 환경 변수 설정 가이드입니다.

## 📋 환경 변수 설정

### 1. User Service

Railway 대시보드 → User Service → Settings → Variables:

```
SPRING_PROFILES_ACTIVE=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=your-random-secret-key-minimum-32-characters-long
JWT_EXPIRATION=86400000
PORT=8082
```

**중요:**
- `DATABASE_URL`은 Railway PostgreSQL 서비스를 연결하면 자동으로 제공됩니다
- `JWT_SECRET`은 최소 32자의 랜덤 문자열로 변경하세요
- `PORT`는 Railway가 자동으로 할당하므로 설정하지 않아도 됩니다

### 2. Audition Service

```
SPRING_PROFILES_ACTIVE=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_HOST=${{Redis.HOST}}
REDIS_PORT=${{Redis.PORT}}
PORT=8081
```

**참고:** Redis를 사용하지 않는 경우 `REDIS_HOST`와 `REDIS_PORT`는 생략 가능합니다.

### 3. Media Service

```
SPRING_PROFILES_ACTIVE=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
PORT=8083
```

### 4. Gateway

**다른 서비스들이 배포된 후에 설정하세요!**

각 서비스의 Public URL을 확인한 후:

```
SPRING_PROFILES_ACTIVE=production
USER_SERVICE_URL=https://your-user-service.railway.app
AUDITION_SERVICE_URL=https://your-audition-service.railway.app
MEDIA_SERVICE_URL=https://your-media-service.railway.app
PORT=8080
```

**Public URL 확인 방법:**
1. 각 서비스의 Settings → Networking
2. Public URL 복사
3. Gateway의 환경 변수에 설정

## 🔧 DATABASE_URL 처리

Railway는 `DATABASE_URL`을 `postgresql://user:password@host:port/database` 형식으로 제공합니다.

이 프로젝트는 `DatabaseConfig` 클래스를 통해 자동으로 Spring Boot가 사용하는 `jdbc:postgresql://...` 형식으로 변환합니다.

**수동 설정이 필요한 경우:**

Railway에서 `DATABASE_URL` 대신 개별 변수를 사용할 수도 있습니다:

```
SPRING_DATASOURCE_URL=jdbc:postgresql://host:port/database
SPRING_DATASOURCE_USERNAME=username
SPRING_DATASOURCE_PASSWORD=password
```

## ✅ 배포 순서

1. **PostgreSQL 서비스 생성** (Railway에서 제공)
2. **User Service 배포**
3. **Audition Service 배포**
4. **Media Service 배포**
5. **Gateway 배포** (마지막, 다른 서비스 URL 필요)

## 🚨 문제 해결

### DATABASE_URL 변환 실패
- `DatabaseConfig`가 자동으로 처리하지만, 문제가 있다면 수동으로 `SPRING_DATASOURCE_URL` 설정

### Gateway 502 Bad Gateway
- 다른 서비스들이 정상 작동하는지 확인
- Gateway의 환경 변수에 올바른 URL이 설정되어 있는지 확인
- 각 서비스의 Public URL이 올바른지 확인

### 서비스 시작 실패
- Railway 로그 확인
- 환경 변수 누락 확인
- `SPRING_PROFILES_ACTIVE=production` 설정 확인
