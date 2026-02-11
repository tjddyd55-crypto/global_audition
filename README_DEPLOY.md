# 배포 가이드

## 로컬 실행

### 백엔드
```powershell
cd backend
.\mvnw.cmd spring-boot:run
```
(Postgres 등 환경 변수 설정 필요. `docs/RAILWAY_RESET_RUNBOOK.md` 참고.)

### 프론트엔드
```powershell
cd frontend\web
npm install
npm run dev
```

## 프로덕션 빌드

### 백엔드 (단일 JAR)
```powershell
cd backend
.\mvnw.cmd -DskipTests package
java -jar target\*.jar
```

### 프론트엔드
```powershell
cd frontend\web
npm run build
npm start
```

## Railway 배포

- **Backend:** Root = `backend`, Build = `chmod +x mvnw && ./mvnw -DskipTests package`, Start = `java -jar target/*.jar`
- **Frontend:** Root = `frontend/web`, 환경 변수 `NEXT_PUBLIC_API_URL` = 백엔드 URL
- **Postgres:** Railway Postgres 한 대, Backend에 `SPRING_DATASOURCE_*` 설정

자세한 단계는 `docs/RAILWAY_RESET_RUNBOOK.md` 참고.
