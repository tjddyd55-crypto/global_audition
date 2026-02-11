# MVP_01: 오디션 핵심 실행 흐름 안정화

## 목적
오디션 핵심 실행 흐름(생성→지원→심사→결과)을 100% 안정화

## 상태 전이 규칙 (확정)

### 오디션 상태 (AuditionStatus)
- **WRITING**: 작성 중 (기획사가 오디션 정보 입력 중)
- **WAITING_OPENING**: 오픈 대기 (작성 완료, 오픈 전)
- **ONGOING**: 진행 중 (모집 중, 지원 가능)
- **UNDER_SCREENING**: 심사 중 (모집 마감, 심사 진행)
- **FINISHED**: 종료 (심사 완료, 결과 발표 완료)

### 오디션 상태 전이 규칙
1. WRITING → WAITING_OPENING: 오디션 작성 완료
2. WAITING_OPENING → ONGOING: 오디션 오픈 (startDate 도달)
3. ONGOING → UNDER_SCREENING: 모집 마감 (endDate 도달)
4. UNDER_SCREENING → FINISHED: 심사 완료 및 결과 발표

### 지원서 상태 (ApplicationStatus)
- **WRITING**: 작성 중 (지원서 작성 중)
- **INCOMPLETE_PAYMENT**: 결제 미완료 (포인트 차감 실패)
- **APPLICATION_COMPLETED**: 지원 완료 (포인트 차감 성공, 심사 대기)
- **CANCEL**: 취소됨

### 지원서 심사 단계 (currentStage)
- **0**: 지원 완료 (APPLICATION_COMPLETED)
- **1**: 1차 합격
- **2**: 2차 합격
- **3**: 최종 합격

### 심사 결과 (ScreeningResult)
- **PASS**: 합격
- **FAIL**: 불합격
- **PENDING**: 심사 중

### 심사 단계별 전이 규칙
1. **1차 심사** (currentStage=0 → 1)
   - PASS → currentStage=1, result1=PASS
   - FAIL → currentStage=0 유지, result1=FAIL
   - PENDING → currentStage=0 유지, result1=PENDING

2. **2차 심사** (currentStage=1 → 2)
   - 전제: result1=PASS
   - PASS → currentStage=2, result2=PASS
   - FAIL → currentStage=1 유지, result2=FAIL
   - PENDING → currentStage=1 유지, result2=PENDING

3. **3차 심사** (currentStage=2 → 3)
   - 전제: result2=PASS
   - PASS → currentStage=3, result3=PASS
   - FAIL → currentStage=2 유지, result3=FAIL
   - PENDING → currentStage=2 유지, result3=PENDING

4. **최종 결과** (finalResult)
   - 전제: maxRounds에 따라 이전 단계 모두 PASS
   - PASS → finalResult=PASS
   - FAIL → finalResult=FAIL
   - PENDING → finalResult=PENDING

## 검증 규칙

### 오디션 상태 전이 검증
- WRITING → WAITING_OPENING: 필수 필드 검증 필요
- WAITING_OPENING → ONGOING: startDate 검증 필요
- ONGOING → UNDER_SCREENING: endDate 검증 필요
- UNDER_SCREENING → FINISHED: 모든 심사 완료 확인 필요

### 지원서 상태 전이 검증
- 지원 생성 시: 포인트 차감 필수 (실패 시 지원서 생성 불가)
- 심사 결과 업데이트 시: 이전 단계 합격 확인 필수
- 최종 결과 설정 시: maxRounds에 따른 단계별 합격 확인 필수

## 예외 처리

### 지원서 생성 실패 시나리오
1. 포인트 부족 → RuntimeException, 트랜잭션 롤백
2. 중복 지원 → RuntimeException
3. 오디션 모집 마감 → RuntimeException

### 심사 결과 업데이트 실패 시나리오
1. 이전 단계 미합격 → IllegalStateException
2. 이미 결과 설정됨 → IllegalStateException
3. currentStage 불일치 → IllegalStateException

## 구현 위치
- 상태 전이 로직: `ApplicationStatusTransitionService`
- 지원서 생성: `ApplicationService.createApplication`
- 심사 결과 업데이트: `ApplicationService.updateScreeningResult*`
