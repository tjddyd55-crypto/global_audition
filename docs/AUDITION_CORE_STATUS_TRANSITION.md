# 오디션 심사 단계 및 상태 전이 규칙

## 작업 정보
**작업 ID**: 2026_11_audition_core  
**목적**: 오디션 심사 단계와 지원자 상태 전이를 명확히 정리

## 상태 정의

### ApplicationStatus (지원서 상태)
- `WRITING`: 작성 중
- `INCOMPLETE_PAYMENT`: 결제 미완료
- `APPLICATION_COMPLETED`: 지원 완료
- `CANCEL`: 취소

### ScreeningResult (심사 결과)
- `PASS`: 합격
- `FAIL`: 불합격
- `PENDING`: 심사 중

### currentStage (현재 단계)
- `0`: 지원 완료 (APPLICATION_COMPLETED)
- `1`: 1차 합격
- `2`: 2차 합격
- `3`: 최종 합격

## 상태 전이 규칙

### 1. 지원 완료 → 1차 심사

**전제 조건:**
- `currentStage == 0`
- `status == APPLICATION_COMPLETED`
- `result1 == null` 또는 `result1 == PENDING`

**전이 규칙:**
- `result1 = PASS` → `currentStage = 1`
- `result1 = FAIL` → `currentStage = 0` (유지)
- `result1 = PENDING` → `currentStage = 0` (유지)

**검증:**
- `currentStage != 0`이면 예외 발생
- `result1`이 이미 설정되어 있으면 예외 발생 (PENDING 제외)

### 2. 1차 합격 → 2차 심사

**전제 조건:**
- `currentStage >= 1`
- `result1 == PASS`
- `result2 == null` 또는 `result2 == PENDING`

**전이 규칙:**
- `result2 = PASS` → `currentStage = 2`
- `result2 = FAIL` → `currentStage = 1` (유지)
- `result2 = PENDING` → `currentStage = 1` (유지)

**검증:**
- `currentStage < 1`이면 예외 발생
- `result1 != PASS`이면 예외 발생
- `result2`가 이미 설정되어 있으면 예외 발생 (PENDING 제외)

### 3. 2차 합격 → 3차 심사

**전제 조건:**
- `currentStage >= 2`
- `result2 == PASS`
- `result3 == null` 또는 `result3 == PENDING`

**전이 규칙:**
- `result3 = PASS` → `currentStage = 3`
- `result3 = FAIL` → `currentStage = 2` (유지)
- `result3 = PENDING` → `currentStage = 2` (유지)

**검증:**
- `currentStage < 2`이면 예외 발생
- `result2 != PASS`이면 예외 발생
- `result3`가 이미 설정되어 있으면 예외 발생 (PENDING 제외)

### 4. 최종 결과 설정

**전제 조건:**
- 오디션의 `maxRounds`에 따라 이전 단계 합격 확인:
  - `maxRounds >= 3`: `result3 == PASS`
  - `maxRounds >= 2`: `result2 == PASS`
  - `maxRounds >= 1`: `result1 == PASS`
- `finalResult == null` 또는 `finalResult == PENDING`

**전이 규칙:**
- `finalResult = PASS` → `currentStage`는 이미 최종 단계 (변경 없음)
- `finalResult = FAIL` → `currentStage` 유지
- `finalResult = PENDING` → `currentStage` 유지

**검증:**
- `maxRounds`에 맞는 이전 단계 합격이 없으면 예외 발생
- `finalResult`가 이미 설정되어 있으면 예외 발생 (PENDING 제외)

## 구현 위치

### Service 레이어
- `ApplicationStatusTransitionService`: 상태 전이 로직 및 검증
- `ApplicationService`: 상태 전이 서비스 호출

### 주요 메서드
- `updateStage1Result()`: 1차 심사 결과 업데이트
- `updateStage2Result()`: 2차 심사 결과 업데이트
- `updateStage3Result()`: 3차 심사 결과 업데이트
- `updateFinalResult()`: 최종 결과 업데이트

## 예외 처리

모든 상태 전이는 다음 경우 예외를 발생시킵니다:
1. 전제 조건 불만족
2. 이미 결과가 설정된 경우 (PENDING 제외)
3. 순서가 맞지 않는 경우 (예: 2차 심사 결과를 1차 합격 전에 설정)

## 로깅

모든 상태 전이는 다음 정보를 로깅합니다:
- Application ID
- 이전 상태
- 새 상태
- currentStage 변경 여부

## DB 스키마 유지

기존 DB 스키마는 변경하지 않음:
- `applications` 테이블 구조 유지
- `current_stage`, `result1`, `result2`, `result3`, `final_result` 컬럼 그대로 사용
