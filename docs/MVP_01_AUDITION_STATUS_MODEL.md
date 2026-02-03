# MVP_01: 오디션 상태 모델 (명확히 고정)

## 오디션 상태 (AuditionStatus)

### 상태 정의
- **DRAFT**: 작성 중 (기획사가 오디션 정보 입력 중)
- **OPEN**: 지원 가능 (모집 중, 지원자 접수 가능)
- **CLOSED**: 지원 마감 (모집 마감, 심사 진행 중)
- **FINALIZED**: 결과 확정 (심사 완료, 결과 발표 완료)

### 상태 전이 규칙
1. **DRAFT → OPEN**: 오디션 작성 완료, 오픈 전환
2. **OPEN → CLOSED**: 모집 마감 (endDate 도달 또는 수동 마감)
3. **CLOSED → FINALIZED**: 모든 심사 완료, 결과 확정

### 상태 전이 제약
- ❌ 상태 스킵 금지 (예: DRAFT → CLOSED 불가)
- ❌ 상태 역행 금지 (예: OPEN → DRAFT 불가)
- ✅ 상태 변경은 반드시 권한 체크 + 이전 상태 검증

### 기존 상태 매핑 (하위 호환성)
- WRITING → DRAFT
- WAITING_OPENING → DRAFT (오픈 대기)
- ONGOING → OPEN
- UNDER_SCREENING → CLOSED
- FINISHED → FINALIZED

## 지원서 상태 (ApplicationStatus)

### 상태 정의
- **APPLIED**: 지원 완료 (포인트 차감 성공, 심사 대기)
- **SCREENING_1_PASSED**: 1차 합격
- **SCREENING_1_FAILED**: 1차 불합격
- **SCREENING_2_PASSED**: 2차 합격
- **SCREENING_2_FAILED**: 2차 불합격
- **SCREENING_3_PASSED**: 3차 합격
- **SCREENING_3_FAILED**: 3차 불합격
- **FINAL_PASSED**: 최종 합격
- **FINAL_FAILED**: 최종 불합격

### 상태 전이 규칙
1. **APPLIED → SCREENING_1_PASSED/FAILED**: 1차 심사 결과
2. **SCREENING_1_PASSED → SCREENING_2_PASSED/FAILED**: 2차 심사 결과
3. **SCREENING_2_PASSED → SCREENING_3_PASSED/FAILED**: 3차 심사 결과
4. **SCREENING_*_PASSED → FINAL_PASSED/FAILED**: 최종 결과

### 상태 전이 제약
- ❌ 상태 스킵 금지 (예: APPLIED → SCREENING_2_PASSED 불가)
- ❌ 상태 역행 금지 (예: SCREENING_2_PASSED → SCREENING_1_PASSED 불가)
- ✅ FINALIZED 이후 상태 변경 불가

### 기존 상태 매핑 (하위 호환성)
- APPLICATION_COMPLETED → APPLIED
- WRITING → 지원 작성 중 (APPLIED 전 단계)
- INCOMPLETE_PAYMENT → 포인트 차감 실패
- CANCEL → 지원 취소

## 권한 적용 (STEP 1 기준)

- 오디션 생성/수정/삭제 → **AGENCY**
- 지원 생성 → **APPLICANT**
- 1~3차 심사 결과 입력 → **AGENCY or TRAINER**
- 최종 결과 확정 → **AGENCY only**

## UX 포인트

1. **OPEN 상태가 아니면 지원 버튼 비활성**
2. **FINALIZED 이후**:
   - 심사 결과 수정 불가
   - 지원자 상태 고정
3. **TRAINER는**:
   - 결과 "입력"만 가능
   - 오디션 메타 정보 수정 불가
