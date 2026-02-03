# api-backend 빌드 오류 해결 가이드

## `./gradlew not found` 오류

### 원인
**Root Directory 설정 문제**

### 해결 방법

1. **Root Directory 확인**
   - Railway Dashboard → api-backend 서비스 → Settings
   - Root Directory가 `backend`로 설정되어 있는지 확인
   - ❗ 반드시 `backend`로 설정해야 함

2. **gradlew 위치 확인**
   - gradlew는 `backend/`에 존재
   - `backend/gradlew` 경로에서 접근 가능해야 함

3. **Build Command 확인**
   - Build Command: `./gradlew clean build`
   - Root Directory가 `backend`이면 `./gradlew`로 접근 가능

### 절대 하지 말 것

- ❌ gradlew를 이동하지 않음
- ❌ gradlew를 복사하지 않음
- ❌ gradlew를 재생성하지 않음
- ❌ Root Directory를 `backend`가 아닌 다른 경로로 설정하지 않음

### 올바른 설정

```
Railway 서비스: api-backend
Root Directory: backend
Build Command: ./gradlew clean build
Start Command: java -jar services/gateway/build/libs/gateway.jar
```

### 폴더 구조

```
backend/                    # Root Directory (Railway에서 설정)
├── gradlew                 # 여기에 존재
├── gradlew.bat
├── gradle/
│   └── wrapper/
├── services/
│   ├── gateway/
│   ├── user-service/
│   └── audition-service/
└── pom.xml
```

### 확인 방법

Railway 빌드 로그에서:
- `./gradlew not found` → Root Directory가 `backend`가 아님
- `./gradlew: Permission denied` → 실행 권한 문제 (별도 해결 필요)
- `./gradlew clean build` 성공 → Root Directory 설정 정상

## 주의사항

- Root Directory는 반드시 `backend`로 설정
- gradlew는 `backend/`에 존재하며 이동/복사/재생성하지 않음
- Build Command는 `./gradlew clean build` (backend에서 실행)
