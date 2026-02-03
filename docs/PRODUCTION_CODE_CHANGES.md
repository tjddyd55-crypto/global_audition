# 프로덕션 서버 구조에 맞춘 코드 변경 사항

## 변경 원칙
- **서버 구조를 SSOT로 삼음**: 프로덕션 서버 구조에 맞춰 코드 수정
- **User/Audition은 논리적 모듈로만 분리**: 배포/포트/DB는 통합 구조
- **서버와 코드가 어긋나는 경우**: 서버를 바꾸지 말고 코드를 수정

## 변경된 파일

### 1. UserServiceClient
**파일**: `audition-service/src/main/java/.../UserServiceClient.java`
- **변경**: `user.service.url` 기본값을 `http://localhost:${server.port:8080}`로 변경
- **이유**: 프로덕션에서 api-backend는 통합 구조이므로 같은 서버 내부 호출

### 2. PointServiceClient
**파일**: `audition-service/src/main/java/.../PointServiceClient.java`
- **변경**: `user.service.url` 기본값을 `http://localhost:${server.port:8080}`로 변경
- **이유**: 프로덕션에서 api-backend는 통합 구조이므로 같은 서버 내부 호출

### 3. application-production.yml
**파일**: `audition-service/src/main/resources/application-production.yml`
- **변경**: `user.service.url: http://localhost:${PORT}` 추가
- **이유**: 프로덕션 환경 변수 설정

## 프로덕션 서버 구조

### api-backend (통합)
- Gateway + User Service + Audition Service 통합 배포
- 포트: ${PORT} (Railway/서버에서 설정)
- DB: postgres-main (통합 DB)
- 내부 호출: localhost로 호출 (같은 서버 내부)

### media-service (독립)
- 독립 서비스로 배포
- 포트: ${PORT:8083}
- DB: postgres-main (통합 DB)
- 외부 호출: api-backend에서 HTTP로 호출

## 환경 변수 (프로덕션)

### api-backend
```bash
PORT=${PORT}
DATABASE_PUBLIC_URL=jdbc:postgresql://postgres-main:5432/railway
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=${DB_PASSWORD}
JWT_SECRET=${JWT_SECRET}
user.service.url=http://localhost:${PORT}
```

### media-service
```bash
PORT=${PORT:8083}
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres-main:5432/railway
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=${DB_PASSWORD}
JWT_SECRET=${JWT_SECRET}  # api-backend와 동일
```

## 주의사항

1. **로컬 개발**: 여전히 별도 서비스로 실행 가능 (localhost:8081, localhost:8082)
2. **프로덕션**: api-backend로 통합 배포 시 환경 변수 설정 필요
3. **DB 스키마**: 통합 DB 사용 (postgres-main)
4. **내부 호출**: api-backend 내부에서는 localhost로 호출
