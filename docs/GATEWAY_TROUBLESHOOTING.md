# Gateway Service 문제 해결 가이드

## 문제: Gateway를 통한 API 호출 시 500/404 에러

### 원인 분석

1. **500 Internal Server Error**: 
   - Gateway가 다른 서비스에 연결하지 못함
   - 서비스 URL이 잘못 설정됨
   - HTTPS/HTTP 혼용 문제

2. **404 Not Found**:
   - 라우팅 설정 문제
   - 서비스 경로가 맞지 않음

## 해결 방법

### 1. Railway 환경 변수 확인 (중요)

Railway 대시보드에서 `gateway` → "Variables" 탭에서 다음 변수들이 정확히 설정되어 있는지 확인:

```bash
SPRING_PROFILES_ACTIVE=production
USER_SERVICE_URL=https://user-service-production-7ba1.up.railway.app
AUDITION_SERVICE_URL=https://audition-service-production.up.railway.app
MEDIA_SERVICE_URL=https://media-service-production-dff0.up.railway.app
```

**확인 사항:**
- ✅ 모든 URL이 HTTPS로 시작하는가?
- ✅ URL 끝에 슬래시(`/`)가 없는가?
- ✅ 서비스 이름이 정확한가?

### 2. 각 서비스의 Health Check 확인

Gateway를 거치지 않고 직접 각 서비스를 호출하여 정상 작동 확인:

```bash
# User Service
https://user-service-production-7ba1.up.railway.app/actuator/health

# Audition Service
https://audition-service-production.up.railway.app/actuator/health

# Media Service
https://media-service-production-dff0.up.railway.app/actuator/health
```

모든 서비스가 "UP" 상태여야 합니다.

### 3. Gateway 로그 확인

Railway 대시보드에서:
1. `gateway` → "Deployments" → 최신 배포 → "View Logs"
2. 다음을 확인:
   - Gateway가 시작되었는지
   - 환경 변수가 로드되었는지
   - 라우팅 설정이 로드되었는지
   - 에러 메시지가 있는지

예상 로그 메시지:
```
Route user-service: http://user-service-production-7ba1.up.railway.app
Route audition-service: http://audition-service-production.up.railway.app
Route media-service: http://media-service-production-dff0.up.railway.app
```

### 4. 환경 변수 형식 확인

**올바른 형식:**
```bash
USER_SERVICE_URL=https://user-service-production-7ba1.up.railway.app
```

**잘못된 형식:**
```bash
USER_SERVICE_URL=https://user-service-production-7ba1.up.railway.app/  # 끝에 슬래시 있음
USER_SERVICE_URL=http://user-service-production-7ba1.up.railway.app   # HTTP (HTTPS여야 함)
USER_SERVICE_URL=user-service-production-7ba1.up.railway.app          # 프로토콜 없음
```

### 5. 직접 서비스 호출 테스트

Gateway를 거치지 않고 직접 각 서비스 API를 호출하여 정상 작동 확인:

**User Service:**
```bash
GET https://user-service-production-7ba1.up.railway.app/api/v1/auth/register
# 또는 POST 요청
```

**Audition Service:**
```bash
GET https://audition-service-production.up.railway.app/api/v1/auditions
```

**Media Service:**
```bash
GET https://media-service-production-dff0.up.railway.app/api/v1/videos
```

### 6. Gateway 재배포

환경 변수를 수정한 후:
1. Railway 대시보드에서 `gateway` → "Deployments"
2. "Redeploy" 버튼 클릭
3. 또는 새 커밋을 푸시하여 자동 재배포

### 7. Gateway Routes 확인

배포 후 다음 엔드포인트로 라우팅 설정 확인:

```
https://gateway-production-72d6.up.railway.app/actuator/gateway/routes
```

또는:
```
https://gateway-production-72d6.up.railway.app/actuator
```

## 일반적인 문제 및 해결책

### 문제 1: 환경 변수가 설정되지 않음

**증상:** Gateway가 `localhost`로 라우팅 시도

**해결:** Railway 환경 변수에서 모든 서비스 URL 설정 확인

### 문제 2: HTTPS/HTTP 혼용

**증상:** SSL 에러 또는 연결 실패

**해결:** 모든 URL을 HTTPS로 통일

### 문제 3: 서비스가 응답하지 않음

**증상:** 500 Internal Server Error

**해결:** 각 서비스의 Health Check 확인 및 로그 확인

### 문제 4: 라우팅 경로가 맞지 않음

**증상:** 404 Not Found

**해결:** 
- Gateway 라우팅 설정 확인
- 실제 서비스 API 경로 확인
- Path predicate가 올바른지 확인

## 확인 체크리스트

- [ ] Railway 환경 변수에 모든 서비스 URL 설정됨
- [ ] 모든 URL이 HTTPS로 시작함
- [ ] URL 끝에 슬래시 없음
- [ ] 각 서비스 Health Check 통과
- [ ] Gateway Health Check 통과
- [ ] Gateway 로그에 라우팅 설정이 로드됨
- [ ] 직접 서비스 호출이 정상 작동함

## 추가 디버깅

### Gateway 로그 레벨 증가

`application-production.yml`에 추가:

```yaml
logging:
  level:
    org.springframework.cloud.gateway: DEBUG
    org.springframework.web: DEBUG
```

이렇게 하면 Gateway의 라우팅 과정을 자세히 볼 수 있습니다.
