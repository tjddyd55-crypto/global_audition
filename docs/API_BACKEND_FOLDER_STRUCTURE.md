# api-backend 폴더 구조 명확화

## 중요 원칙

**api-backend는 Railway 서비스 이름일 뿐, 실제 폴더명이 아님**

- ❌ `api-backend` 폴더를 만들지 않음
- ❌ 폴더 구조를 변경하지 않음
- ✅ Root Directory: `backend` (또는 repo-root)
- ✅ 엔트리 포인트: `gateway` (backend/services/gateway)

## 실제 폴더 구조

```
audition-platform/
├── backend/                    # Root Directory (Railway에서 설정)
│   ├── services/
│   │   ├── gateway/           # 엔트리 포인트
│   │   │   ├── src/
│   │   │   └── pom.xml
│   │   ├── user-service/      # 논리적 모듈 (user-domain)
│   │   │   ├── src/
│   │   │   └── pom.xml
│   │   └── audition-service/  # 논리적 모듈 (audition-domain)
│   │       ├── src/
│   │       └── pom.xml
│   ├── media-service/         # 독립 서비스
│   │   ├── src/
│   │   └── pom.xml
│   └── pom.xml
└── frontend/
    └── web/
```

## Railway 배포 설정

### api-backend 서비스 (Railway 서비스 이름)
- **Root Directory**: `backend`
- **Build Command**: `./gradlew clean build` (backend에서 실행)
- **Start Command**: `java -jar services/gateway/build/libs/gateway.jar`
- **엔트리 포인트**: `gateway` (backend/services/gateway)

### media-service 서비스
- **Root Directory**: `backend/media-service`
- **Build Command**: `./gradlew clean build`
- **Start Command**: `java -jar build/libs/media-service.jar`

## 핵심 원칙

1. **api-backend는 Railway 서비스 이름**: 실제 폴더명이 아님
2. **Root Directory는 backend**: Railway에서 `backend`로 설정
3. **gateway가 엔트리 포인트**: backend/services/gateway에서 시작
4. **폴더 구조 변경 금지**: gateway, user-service, audition-service 구조 유지
5. **논리적 모듈 분리**: User/Audition은 논리적으로만 분리, 폴더 구조는 유지

## 주의사항

- ❗ `api-backend` 폴더를 만들지 않음
- ❗ 폴더 구조를 변경하지 않음
- ❗ 새로운 통합 모듈을 만들지 않음
- ✅ 현재 구조 유지
- ✅ gateway가 엔트리 포인트
