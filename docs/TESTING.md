# 테스트 가이드

## 백엔드 테스트

### 단위 테스트 실행

```bash
# Audition Service
cd backend/services/audition-service
./mvnw test

# User Service
cd backend/services/user-service
./mvnw test

# Media Service
cd backend/services/media-service
./mvnw test
```

### 통합 테스트 실행

```bash
# 모든 서비스 테스트
cd backend
mvn test
```

## 프론트엔드 테스트

### 테스트 실행

```bash
cd frontend/web
npm test

# Watch 모드
npm run test:watch

# 커버리지
npm run test:coverage
```

## 테스트 커버리지

각 서비스별 테스트 커버리지 목표:
- Repository: 80% 이상
- Service: 80% 이상
- Controller: 70% 이상

## 테스트 전략

### 백엔드
- **Repository 테스트**: DataJpaTest 사용, H2 인메모리 DB
- **Service 테스트**: Mockito를 사용한 단위 테스트
- **Controller 테스트**: MockMvc를 사용한 웹 레이어 테스트

### 프론트엔드
- **컴포넌트 테스트**: React Testing Library
- **API 클라이언트 테스트**: MSW (Mock Service Worker)
