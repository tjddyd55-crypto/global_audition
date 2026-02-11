# Backend (Single Spring Boot)

단일 Spring Boot 애플리케이션. Flyway로 DB 스키마 관리, Hibernate ddl-auto=none (production).

## 빌드 및 실행

```bash
./mvnw -DskipTests package
java -jar target/*.jar
```

로컬에서 실행 시 Postgres URL은 `src/main/resources/application.yml` 또는 환경 변수(`SPRING_DATASOURCE_*`)로 설정.

Railway 배포: Root = `backend`, `docs/RAILWAY_RESET_RUNBOOK.md` 참고.
