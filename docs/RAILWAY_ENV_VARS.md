# Railway 환경 변수 설정 가이드

## 📌 기본 원칙

**기존 환경 변수를 삭제할 필요 없습니다!**

Railway의 환경 변수는:
- ✅ **개별적으로 추가/수정** 가능
- ✅ 같은 이름이 있으면 **자동으로 덮어쓰기**
- ✅ 없는 변수는 **새로 추가**
- ✅ 기존 다른 변수는 **그대로 유지**

## 🔧 설정 방법

### 방법 1: Railway 대시보드에서 설정

1. Railway 대시보드 접속
2. 각 서비스 선택
3. **Settings** → **Variables** 탭 클릭
4. **"New Variable"** 버튼 클릭
5. 변수 이름과 값 입력
6. **"Add"** 클릭

### 방법 2: 기존 변수 수정

1. Variables 탭에서 기존 변수 찾기
2. 변수 옆의 **연필 아이콘** 클릭
3. 값 수정
4. **"Save"** 클릭

## 📋 각 서비스별 필수 환경 변수

### User Service

**추가/수정할 변수:**
```
SPRING_PROFILES_ACTIVE=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=최소-32자-랜덤-문자열-입력-필수
JWT_EXPIRATION=86400000
```

**설정 순서:**
1. `SPRING_PROFILES_ACTIVE` 추가/수정
2. `DATABASE_URL` 추가 (PostgreSQL 서비스 연결 시 자동 생성될 수도 있음)
3. `JWT_SECRET` 추가 (반드시 최소 32자 랜덤 문자열)
4. `JWT_EXPIRATION` 추가

### Audition Service

**추가/수정할 변수:**
```
SPRING_PROFILES_ACTIVE=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

**선택 사항 (Redis 사용 시):**
```
REDIS_HOST=${{Redis.HOST}}
REDIS_PORT=${{Redis.PORT}}
```

### Media Service

**추가/수정할 변수:**
```
SPRING_PROFILES_ACTIVE=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

### Gateway

**다른 서비스들이 배포된 후에 설정하세요!**

**추가/수정할 변수:**
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

## ✅ 확인 방법

### Railway 대시보드에서 확인

1. 각 서비스의 **Settings → Variables** 탭
2. 설정한 환경 변수들이 목록에 표시되는지 확인
3. 값이 올바르게 설정되었는지 확인

### 배포 후 로그에서 확인

1. 각 서비스의 **Logs** 탭
2. 환경 변수가 올바르게 로드되었는지 확인
3. 에러 메시지 확인

## 🚨 주의사항

### 1. DATABASE_URL
- Railway PostgreSQL 서비스를 연결하면 자동으로 생성될 수 있습니다
- 이미 있다면 그대로 사용하거나, `${{Postgres.DATABASE_URL}}` 형식으로 수정

### 2. JWT_SECRET
- **반드시 최소 32자의 랜덤 문자열**로 설정
- 예: `my-super-secret-jwt-key-for-production-use-only-2024`
- 보안을 위해 예측 불가능한 값 사용

### 3. Gateway URL
- 다른 서비스들이 모두 배포된 후에 설정
- Public URL은 `https://`로 시작해야 함
- 각 서비스의 실제 Public URL 사용

### 4. 환경 변수 이름
- 대소문자 구분
- 정확한 이름 사용 (오타 주의)

## 🔄 환경 변수 업데이트

환경 변수를 수정하면:
- Railway가 자동으로 서비스를 재배포합니다
- 변경 사항이 즉시 적용됩니다
- 로그에서 변경 사항 확인 가능

## ❓ 자주 묻는 질문

### Q: 기존 환경 변수를 모두 삭제해야 하나요?
**A:** 아니요! 필요한 것만 추가/수정하면 됩니다.

### Q: DATABASE_URL이 이미 있는데 어떻게 하나요?
**A:** 그대로 사용하거나, `${{Postgres.DATABASE_URL}}` 형식으로 수정하세요.

### Q: 환경 변수를 잘못 설정했어요
**A:** Variables 탭에서 변수를 찾아 수정하거나 삭제할 수 있습니다.

### Q: 여러 서비스에 같은 환경 변수를 설정해야 하나요?
**A:** 네, 각 서비스마다 개별적으로 설정해야 합니다.
