# 🎯 사용자가 해야 할 작업

Railway 배포를 완료하기 위해 사용자가 직접 해야 하는 작업 목록입니다.

## ✅ 완료된 작업 (자동 처리됨)

- [x] `application-production.yml` 파일 생성 (4개 서비스)
- [x] User Service와 Media Service에 Actuator 추가
- [x] Railway DATABASE_URL 자동 변환 설정
- [x] Gateway 라우팅 설정 수정
- [x] 배포 확인 스크립트 생성
- [x] API 테스트 HTML 파일 생성

## 📝 사용자가 해야 할 작업

### 1. Railway 환경 변수 설정

**⚠️ 중요: 기존 환경 변수를 삭제할 필요 없습니다!**

Railway에서는 환경 변수를 **개별적으로 추가/수정**하면 됩니다:
- 같은 이름의 환경 변수가 **이미 있으면** → 자동으로 **덮어쓰기** 됩니다
- 없는 환경 변수는 → **새로 추가**됩니다
- 기존에 있던 다른 환경 변수는 → **그대로 유지**됩니다

각 서비스의 **Settings → Variables**에서 다음 환경 변수를 **추가하거나 수정**하세요:

#### User Service
```
SPRING_PROFILES_ACTIVE=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=여기에-최소-32자-랜덤-문자열-입력
JWT_EXPIRATION=86400000
```

**중요:** `JWT_SECRET`은 반드시 최소 32자의 랜덤 문자열로 변경하세요!

#### Audition Service
```
SPRING_PROFILES_ACTIVE=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

**참고:** Redis를 사용하는 경우 추가:
```
REDIS_HOST=${{Redis.HOST}}
REDIS_PORT=${{Redis.PORT}}
```

#### Media Service
```
SPRING_PROFILES_ACTIVE=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

#### Gateway (다른 서비스 배포 후 설정)
```
SPRING_PROFILES_ACTIVE=production
USER_SERVICE_URL=https://your-user-service.railway.app
AUDITION_SERVICE_URL=https://your-audition-service.railway.app
MEDIA_SERVICE_URL=https://your-media-service.railway.app
```

**Public URL 확인 방법:**
1. 각 서비스의 Settings → Networking
2. Public URL 복사
3. Gateway의 환경 변수에 입력

### 2. 배포 확인

#### 방법 1: 스크립트 사용
```powershell
.\docs\scripts\check-deployment.ps1 -GatewayUrl "https://your-gateway.railway.app"
```

#### 방법 2: 브라우저 테스트
1. `docs/scripts/test-api.html` 파일을 브라우저에서 열기 (해당 파일이 있는 경우)
2. Gateway URL 입력
3. 각 버튼 클릭하여 테스트

#### 방법 3: 직접 확인
브라우저에서 다음 URL 접속:
```
https://your-gateway.railway.app/actuator/health
```

**예상 응답:**
```json
{"status":"UP"}
```

### 3. 문제 발생 시 확인 사항

#### 서비스가 시작되지 않음
- [ ] Railway 로그 확인 (각 서비스의 Logs 탭)
- [ ] 환경 변수 설정 확인
- [ ] `SPRING_PROFILES_ACTIVE=production` 설정 확인
- [ ] `DATABASE_URL` 또는 `SPRING_DATASOURCE_URL` 설정 확인

#### Gateway 502 Bad Gateway
- [ ] 다른 서비스들이 정상 작동하는지 확인
- [ ] Gateway의 환경 변수에 올바른 URL이 설정되어 있는지 확인
- [ ] 각 서비스의 Public URL이 올바른지 확인

#### 데이터베이스 연결 실패
- [ ] PostgreSQL 서비스가 실행 중인지 확인
- [ ] `DATABASE_URL` 환경 변수 확인
- [ ] Railway PostgreSQL 서비스 연결 확인

## 📚 참고 문서

- [DEPLOYMENT_CHECK.md](DEPLOYMENT_CHECK.md) - 상세한 배포 확인 가이드
- [RAILWAY_SETUP.md](RAILWAY_SETUP.md) - Railway 설정 상세 가이드
- [QUICK_CHECK.md](QUICK_CHECK.md) - 빠른 확인 가이드

## 🎉 완료 후

모든 서비스가 정상 작동하면:
1. Gateway의 Public URL을 메모해 두세요
2. 프론트엔드 배포 시 Gateway URL을 사용하세요
3. 전체 시스템 통합 테스트를 진행하세요
