# STEP 1: 회원가입/권한/역할 경계 확정

## 목적
"누가 무엇을 할 수 있는지"를 DB·API 레벨에서 확정

## 고정된 사용자 역할 (ENUM)

### Role 목록 (추가 금지)
- **APPLICANT**: 지원자 / 크리에이터
- **AGENCY**: 기획사 (기존 BUSINESS와 동일)
- **TRAINER**: 트레이너 / 심사자
- **ADMIN**: 운영자

### 역할 변경 규칙
- 회원가입 시 단일 role 선택 (복수 role 금지)
- role 변경은 관리자만 가능
- 향후 확장 가능하지만 이 단계에서는 고정

## 서비스별 권한 경계 (SSOT)

### User Service (권한의 SSOT)
- 회원가입
- 로그인
- role 부여
- 프로필 기본 정보
- 채널 생성/소유
- **권한 판단의 SSOT는 User Service**

### Audition Service
- 오디션 생성 → **AGENCY만 가능**
- 오디션 지원 → **APPLICANT만 가능**
- 심사/피드백 → **AGENCY 또는 TRAINER**
- 결과 확정 → **AGENCY만 가능**
- **Audition Service는 User Service에 권한 질의만 한다**

### Media Service
- 영상 업로드 → 로그인 사용자
- 영상 소유자 = 업로드 유저
- 오디션 제출용 영상 연결 가능

## JWT 토큰 구조
- **userId**: 사용자 ID
- **role**: 사용자 역할 (APPLICANT, AGENCY, TRAINER, ADMIN)

## 권한 체크 방식
- 공통 `requireRole()` 가드 사용
- 서비스 간 권한 체크 방식 통일
- 잘못된 role로 접근 시 403 반환
