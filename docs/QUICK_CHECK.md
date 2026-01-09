# 🚀 빠른 배포 확인 가이드

Railway 배포 후 5분 안에 확인하는 방법

## 1단계: Gateway URL 확인 (1분)

1. Railway 대시보드 접속
2. `gateway` 서비스 선택
3. **Settings** → **Networking** → **Public URL** 복사
   - 예: `https://gateway-production-xxxx.up.railway.app`

## 2단계: 헬스 체크 (1분)

### 방법 A: 브라우저
브라우저 주소창에 입력:
```
https://your-gateway-url.railway.app/actuator/health
```

**성공 시:**
```json
{"status":"UP"}
```

### 방법 B: 스크립트
```powershell
.\scripts\check-deployment.ps1 -GatewayUrl "https://your-gateway-url.railway.app"
```

## 3단계: API 테스트 (2분)

### 방법 A: HTML 테스트 도구
1. `scripts/test-api.html` 파일을 브라우저에서 열기
2. Gateway URL 입력
3. "헬스 체크" 버튼 클릭
4. "오디션 목록" 버튼 클릭
5. "비디오 목록" 버튼 클릭

### 방법 B: curl (터미널)
```bash
# 헬스 체크
curl https://your-gateway-url.railway.app/actuator/health

# 오디션 목록
curl https://your-gateway-url.railway.app/api/v1/auditions

# 비디오 목록
curl https://your-gateway-url.railway.app/api/v1/videos
```

## 4단계: Railway 로그 확인 (1분)

각 서비스의 **Logs** 탭에서 확인:
- ✅ "Started ... in ... seconds" 메시지
- ✅ 에러 메시지 없음
- ✅ 데이터베이스 연결 성공

## ✅ 성공 확인 체크리스트

- [ ] Gateway Health Check: `{"status":"UP"}`
- [ ] 오디션 목록 조회: HTTP 200 응답
- [ ] 비디오 목록 조회: HTTP 200 응답
- [ ] Railway 로그에 에러 없음
- [ ] 모든 서비스가 "Deployed" 상태

## ❌ 문제가 있다면?

### Gateway Health Check 실패
1. Gateway 로그 확인
2. 환경 변수 확인:
   - `USER_SERVICE_URL`
   - `AUDITION_SERVICE_URL`
   - `MEDIA_SERVICE_URL`

### 502 Bad Gateway
- 다른 서비스들이 정상 작동하는지 확인
- Gateway의 환경 변수에 올바른 URL이 설정되어 있는지 확인

### 데이터베이스 연결 실패
- PostgreSQL 서비스가 실행 중인지 확인
- 환경 변수 확인:
  - `SPRING_DATASOURCE_URL`
  - `SPRING_DATASOURCE_USERNAME`
  - `SPRING_DATASOURCE_PASSWORD`

자세한 문제 해결은 [DEPLOYMENT_CHECK.md](DEPLOYMENT_CHECK.md) 참고
