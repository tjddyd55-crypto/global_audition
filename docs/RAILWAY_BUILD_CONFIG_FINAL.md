# Railway 빌드 설정 (최종)

## 서비스별 Railway 설정

### frontend-web
- **Root Directory**: `frontend/web`
- **Build Command**: `npm install && npm run build` (railway.json에서 관리)
- **Start Command**: `npm start` (railway.json에서 관리)
- **설정 SSOT**: `frontend/web/railway.json` (Railway UI 수정 금지)

### media-service
- **Root Directory**: `backend` (반드시 `backend`로 설정)
- **실행 대상 모듈**: `media-service` (backend/services/media-service)
- **Build Command**: `mvn clean package -pl services/media-service -am -DskipTests`
- **Start Command**: `java -jar services/media-service/target/media-service-*.jar`

**중요**: 
- ❗ Root Directory는 `backend/media-service`가 아님
- ✅ Root Directory는 반드시 `backend`
- ✅ Maven 멀티모듈 빌드 사용

### api-backend
- **Railway 서비스 이름**: `api-backend` (실제 폴더명이 아님)
- **Root Directory**: `backend` (반드시 `backend`로 설정)
- **엔트리 포인트**: `gateway` (backend/services/gateway)
- **Build Command**: `mvn clean package -pl services/gateway -am -DskipTests`
- **Start Command**: `java -jar services/gateway/target/gateway-*.jar`

**중요**:
- ❗ `api-backend` 폴더는 존재하지 않음
- ❗ `./gradlew not found` 오류 → Root Directory가 `backend`가 아님
- ✅ gradlew는 `backend/`에 존재하며 이동/복사/재생성하지 않음

## 빌드 오류 해결

### `./gradlew not found` (api-backend)
- **원인**: Root Directory 설정 문제
- **해결**: Root Directory를 반드시 `backend`로 설정
- ❗ gradlew를 이동/복사/재생성하지 않음

### `directory backend/media-service does not exist` (media-service)
- **원인**: Root Directory가 `backend/media-service`로 잘못 설정됨
- **해결**: Root Directory를 `backend`로 설정
- **빌드 명령**: `mvn clean package -pl services/media-service -am -DskipTests`

## Maven 멀티모듈 빌드

### backend/pom.xml 모듈 확인
```xml
<modules>
    <module>services/gateway</module>
    <module>services/user-service</module>
    <module>services/audition-service</module>
    <module>services/media-service</module>
    <module>libs/common-runtime</module>
    <module>libs/common-contract</module>
</modules>
```

### 빌드 명령
- **gateway**: `mvn clean package -pl services/gateway -am -DskipTests`
- **media-service**: `mvn clean package -pl services/media-service -am -DskipTests`

### 결과 파일
- **gateway**: `backend/services/gateway/target/gateway-*.jar`
- **media-service**: `backend/services/media-service/target/media-service-*.jar`

## 절대 금지 사항

- ❌ Root Directory를 `backend/media-service`로 설정
- ❌ Root Directory를 `backend/api-backend`로 설정
- ❌ gradlew 이동/복사/재생성
- ❌ api-backend 폴더 생성
- ❌ 폴더 구조 변경
