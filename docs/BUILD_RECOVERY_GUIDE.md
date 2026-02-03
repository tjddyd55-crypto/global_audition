# 빌드 복구 가이드 (Railway 기준)

## 작업 목적

모든 서비스(frontend-web / api-backend / media-service)가 Railway에서 "빌드 + 실행"까지 정상 동작하도록 전체 복구

- 기능 추가 ❌
- 리팩토링 ❌
- 구조 변경 ❌
- 오직 "빌드·실행 오류 제거 + 서버 기준선 정렬"만 수행

## 1. frontend-web 복구

### 1.1 next.config.js 오류 수정 ✅
- `env._next_intl_trailing_slash` 제거 (next-intl 플러그인이 자동 처리)

### 1.2 Path Alias(@/) 설정 ✅
- `tsconfig.json`에 `baseUrl: "."` 추가
- `paths: { "@/*": ["./src/*"] }` 설정 확인

### 1.3 빌드 명령
```bash
cd frontend/web
npm install
npm run build
```

### 1.4 성공 조건
- `npm run build` 성공
- 경고 최소화
- 기능 미완성 OK, 빌드 실패 ❌

## 2. media-service 복구

### 2.1 Root Directory 설정
- **Railway Root Directory**: `backend`
- **실행 대상 모듈**: `media-service`
- **경로**: `backend/services/media-service`

### 2.2 빌드 명령
```bash
cd backend
mvn clean package -pl services/media-service -am -DskipTests
```

### 2.3 결과 파일
- `backend/services/media-service/target/media-service-*.jar`

### 2.4 성공 조건
- JAR 파일 생성
- Railway에서 실행 성공

## 3. api-backend 복구

### 3.1 프로젝트 구조
- **Maven 멀티모듈**
- **루트**: `backend/pom.xml`
- **실행 엔트리**: `gateway`

### 3.2 backend/pom.xml 확인 ✅
- 모든 모듈 포함:
  - `<module>services/gateway</module>`
  - `<module>services/user-service</module>`
  - `<module>services/audition-service</module>`
  - `<module>services/media-service</module>`
  - `<module>libs/common-runtime</module>`
  - `<module>libs/common-contract</module>`

### 3.3 gateway/pom.xml 확인 ✅
- `<packaging>jar</packaging>`
- `spring-boot-maven-plugin` 존재

### 3.4 빌드 명령
```bash
cd backend
mvn clean package -pl services/gateway -am -DskipTests
```

### 3.5 결과 파일
- `backend/services/gateway/target/gateway-*.jar`

### 3.6 성공 조건
- gateway JAR 생성
- 서버 부팅 로그 출력
- 즉시 종료 ❌

## 4. Railway 배포 설정

### frontend-web
- **Root Directory**: `frontend/web`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### media-service
- **Root Directory**: `backend`
- **Build Command**: `mvn clean package -pl services/media-service -am -DskipTests`
- **Start Command**: `java -jar services/media-service/target/media-service-*.jar`

### api-backend
- **Root Directory**: `backend`
- **Build Command**: `mvn clean package -pl services/gateway -am -DskipTests`
- **Start Command**: `java -jar services/gateway/target/gateway-*.jar`

## 5. 절대 금지 사항

- ❌ 로컬 기준 작업
- ❌ 서버 구조 변경
- ❌ 서비스 추가
- ❌ 프레임워크 교체
- ❌ 임시 파일 생성
- ❌ gradlew 이동/복사/재생성
- ❌ api-backend 폴더 생성
- ❌ 폴더 구조 변경

## 6. 복구 순서

1. frontend-web → 빌드 성공 확인
2. media-service → JAR 생성 및 실행 확인
3. api-backend → gateway JAR 생성 및 실행 확인

각 서비스 빌드 성공 로그 확보 후 다음으로 이동
