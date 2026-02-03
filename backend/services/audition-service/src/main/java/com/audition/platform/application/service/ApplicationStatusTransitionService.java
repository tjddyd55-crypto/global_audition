package com.audition.platform.application.service;

import com.audition.platform.domain.entity.Application;
import com.audition.platform.domain.entity.Audition;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * 지원서 상태 전이 서비스
 * 작업: MVP_01_audition_execution
 * 
 * 심사 단계와 상태 전이를 명확히 관리
 * 상태 스킵/역행 금지
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ApplicationStatusTransitionService {

    /**
     * 심사 단계별 상태 전이 규칙:
     * 
     * currentStage 의미:
     * - 0: 지원 완료 (APPLICATION_COMPLETED)
     * - 1: 1차 합격
     * - 2: 2차 합격
     * - 3: 최종 합격
     * 
     * 상태 전이 규칙:
     * 1. 지원 완료 후 1차 심사 → result1 설정
     * 2. 1차 합격 후 2차 심사 → result2 설정
     * 3. 2차 합격 후 3차 심사 → result3 설정
     * 4. 최종 심사 후 → finalResult 설정
     * 
     * currentStage는 합격 시에만 증가 (PASS일 때만)
     */

    /**
     * 1차 심사 결과 업데이트
     * 
     * 전제 조건:
     * - currentStage == 0 (지원 완료 상태)
     * - result1이 아직 설정되지 않음
     * 
     * 전이 규칙:
     * - PASS → currentStage = 1, result1 = PASS
     * - FAIL → currentStage = 0 유지, result1 = FAIL
     * - PENDING → currentStage = 0 유지, result1 = PENDING
     */
    public void updateStage1Result(Application application, Application.ScreeningResult result) {
        validateStage1Transition(application);
        
        application.setResult1(result);
        
        if (result == Application.ScreeningResult.PASS) {
            application.setCurrentStage(1);
            log.info("1차 합격: applicationId={}, currentStage=1", application.getId());
        } else {
            // FAIL 또는 PENDING은 currentStage 유지
            log.info("1차 심사 결과: applicationId={}, result={}, currentStage=0", 
                    application.getId(), result);
        }
    }

    /**
     * 2차 심사 결과 업데이트
     * 
     * 전제 조건:
     * - currentStage >= 1 (1차 합격 상태)
     * - result1 == PASS
     * - result2가 아직 설정되지 않음
     * 
     * 전이 규칙:
     * - PASS → currentStage = 2, result2 = PASS
     * - FAIL → currentStage = 1 유지, result2 = FAIL
     * - PENDING → currentStage = 1 유지, result2 = PENDING
     */
    public void updateStage2Result(Application application, Application.ScreeningResult result) {
        validateStage2Transition(application);
        
        application.setResult2(result);
        
        if (result == Application.ScreeningResult.PASS) {
            application.setCurrentStage(2);
            log.info("2차 합격: applicationId={}, currentStage=2", application.getId());
        } else {
            // FAIL 또는 PENDING은 currentStage 유지
            log.info("2차 심사 결과: applicationId={}, result={}, currentStage=1", 
                    application.getId(), result);
        }
    }

    /**
     * 3차 심사 결과 업데이트
     * 
     * 전제 조건:
     * - currentStage >= 2 (2차 합격 상태)
     * - result2 == PASS
     * - result3가 아직 설정되지 않음
     * 
     * 전이 규칙:
     * - PASS → currentStage = 3, result3 = PASS
     * - FAIL → currentStage = 2 유지, result3 = FAIL
     * - PENDING → currentStage = 2 유지, result3 = PENDING
     */
    public void updateStage3Result(Application application, Application.ScreeningResult result) {
        validateStage3Transition(application);
        
        application.setResult3(result);
        
        if (result == Application.ScreeningResult.PASS) {
            application.setCurrentStage(3);
            log.info("3차 합격: applicationId={}, currentStage=3", application.getId());
        } else {
            // FAIL 또는 PENDING은 currentStage 유지
            log.info("3차 심사 결과: applicationId={}, result={}, currentStage=2", 
                    application.getId(), result);
        }
    }

    /**
     * 최종 결과 업데이트
     * 
     * 전제 조건:
     * - 오디션의 maxRounds에 따라 이전 단계 합격 확인
     * - finalResult가 아직 설정되지 않음
     * 
     * 전이 규칙:
     * - PASS → finalResult = PASS (currentStage는 이미 최종 단계)
     * - FAIL → finalResult = FAIL (currentStage 유지)
     * - PENDING → finalResult = PENDING (currentStage 유지)
     */
    public void updateFinalResult(Application application, Audition audition, Application.ScreeningResult result) {
        validateFinalResultTransition(application, audition);
        
        application.setFinalResult(result);
        
        log.info("최종 결과 업데이트: applicationId={}, result={}, currentStage={}", 
                application.getId(), result, application.getCurrentStage());
    }

    /**
     * 1차 심사 전이 검증 (MVP_01: 상태 스킵/역행 방지)
     */
    private void validateStage1Transition(Application application) {
        // 지원 완료 상태 확인
        if (application.getStatus() != Application.ApplicationStatus.APPLICATION_COMPLETED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    String.format("1차 심사는 지원 완료 상태에서만 가능합니다. 현재 상태: %s", application.getStatus()));
        }
        
        if (application.getCurrentStage() != 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    String.format("1차 심사는 지원 완료 상태(currentStage=0)에서만 가능합니다. 현재: currentStage=%d", 
                            application.getCurrentStage()));
        }
        
        if (application.getResult1() != null && application.getResult1() != Application.ScreeningResult.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    String.format("1차 심사 결과가 이미 설정되어 있습니다. 현재: result1=%s", 
                            application.getResult1()));
        }
    }

    /**
     * 2차 심사 전이 검증 (MVP_01: 상태 스킵/역행 방지)
     */
    private void validateStage2Transition(Application application) {
        // 1차 합격 상태 확인
        if (application.getResult1() != Application.ScreeningResult.PASS) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    String.format("2차 심사는 1차 합격 후에만 가능합니다. 현재: result1=%s", 
                            application.getResult1()));
        }
        
        if (application.getCurrentStage() < 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    String.format("2차 심사는 1차 합격 상태(currentStage>=1)에서만 가능합니다. 현재: currentStage=%d", 
                            application.getCurrentStage()));
        }
        
        if (application.getResult2() != null && application.getResult2() != Application.ScreeningResult.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    String.format("2차 심사 결과가 이미 설정되어 있습니다. 현재: result2=%s", 
                            application.getResult2()));
        }
    }

    /**
     * 3차 심사 전이 검증 (MVP_01: 상태 스킵/역행 방지)
     */
    private void validateStage3Transition(Application application) {
        // 2차 합격 상태 확인
        if (application.getResult2() != Application.ScreeningResult.PASS) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    String.format("3차 심사는 2차 합격 후에만 가능합니다. 현재: result2=%s", 
                            application.getResult2()));
        }
        
        if (application.getCurrentStage() < 2) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    String.format("3차 심사는 2차 합격 상태(currentStage>=2)에서만 가능합니다. 현재: currentStage=%d", 
                            application.getCurrentStage()));
        }
        
        if (application.getResult3() != null && application.getResult3() != Application.ScreeningResult.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    String.format("3차 심사 결과가 이미 설정되어 있습니다. 현재: result3=%s", 
                            application.getResult3()));
        }
    }

    /**
     * 최종 결과 전이 검증 (MVP_01: 상태 스킵/역행 방지)
     */
    private void validateFinalResultTransition(Application application, Audition audition) {
        // 오디션이 확정되지 않았는지 확인 (FINALIZED 이후 수정 불가)
        if (audition.getStatus() == Audition.AuditionStatus.FINISHED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "오디션이 확정된 후에는 결과를 수정할 수 없습니다");
        }
        
        Integer maxRounds = audition.getMaxRounds();
        
        // maxRounds에 따라 이전 단계 합격 확인
        if (maxRounds >= 3) {
            if (application.getResult3() != Application.ScreeningResult.PASS) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        String.format("최종 결과는 3차 합격 후에만 설정 가능합니다. 현재: result3=%s", 
                                application.getResult3()));
            }
        } else if (maxRounds >= 2) {
            if (application.getResult2() != Application.ScreeningResult.PASS) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        String.format("최종 결과는 2차 합격 후에만 설정 가능합니다. 현재: result2=%s", 
                                application.getResult2()));
            }
        } else if (maxRounds >= 1) {
            if (application.getResult1() != Application.ScreeningResult.PASS) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        String.format("최종 결과는 1차 합격 후에만 설정 가능합니다. 현재: result1=%s", 
                                application.getResult1()));
            }
        }
        
        if (application.getFinalResult() != null && application.getFinalResult() != Application.ScreeningResult.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    String.format("최종 결과가 이미 설정되어 있습니다. 현재: finalResult=%s", 
                            application.getFinalResult()));
        }
    }

    /**
     * 지원서 상태 확인 (디버깅/로깅용)
     */
    public String getStatusSummary(Application application) {
        return String.format(
                "Application[id=%d, currentStage=%d, status=%s, result1=%s, result2=%s, result3=%s, finalResult=%s]",
                application.getId(),
                application.getCurrentStage(),
                application.getStatus(),
                application.getResult1(),
                application.getResult2(),
                application.getResult3(),
                application.getFinalResult()
        );
    }
}
