# Audition Service

오디션 관리 마이크로서비스

## 기능

- 오디션 생성 및 관리
- 오디션 지원 관리
- 심사 프로세스 관리 (1차, 2차, 3차, 최종)
- 오디션 제안 관리

## 실행 방법

```bash
# Maven으로 실행
./mvnw spring-boot:run

# 또는 JAR 빌드 후 실행
./mvnw clean package
java -jar target/audition-service-1.0.0-SNAPSHOT.jar
```

## API 문서

서버 실행 후: http://localhost:8081/swagger-ui.html

## 포트

기본 포트: 8081
