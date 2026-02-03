package com.audition.platform.application.service;

import com.audition.platform.domain.entity.Audition;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * 오디션 상태 전이 서비스
 * 작업: MVP_01_audition_execution
 * 
 * 상태 전이 규칙:
 * - DRAFT → OPEN → CLOSED → FINALIZED
 * - 상태 스킵/역행 금지
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditionStatusTransitionService {

    /**
     * 오디션 상태를 OPEN으로 전환
     * 전제: DRAFT 상태
     */
    public void transitionToOpen(Audition audition) {
        validateTransition(audition, Audition.AuditionStatus.WRITING, "오디션을 오픈할 수 있는 상태가 아닙니다");
        
        // 필수 필드 검증
        if (audition.getTitle() == null || audition.getTitle().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "오디션 제목은 필수입니다");
        }
        if (audition.getStartDate() == null || audition.getEndDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "모집 기간은 필수입니다");
        }
        if (audition.getStartDate().isAfter(audition.getEndDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "모집 시작일은 종료일보다 빨라야 합니다");
        }

        audition.setStatus(Audition.AuditionStatus.ONGOING); // ONGOING = OPEN
        log.info("오디션 오픈: auditionId={}", audition.getId());
    }

    /**
     * 오디션 상태를 CLOSED로 전환
     * 전제: OPEN 상태
     */
    public void transitionToClosed(Audition audition) {
        validateTransition(audition, Audition.AuditionStatus.ONGOING, "오디션을 마감할 수 있는 상태가 아닙니다");
        
        audition.setStatus(Audition.AuditionStatus.UNDER_SCREENING); // UNDER_SCREENING = CLOSED
        log.info("오디션 마감: auditionId={}", audition.getId());
    }

    /**
     * 오디션 상태를 FINALIZED로 전환
     * 전제: CLOSED 상태, 모든 심사 완료
     */
    public void transitionToFinalized(Audition audition) {
        validateTransition(audition, Audition.AuditionStatus.UNDER_SCREENING, "오디션을 확정할 수 있는 상태가 아닙니다");
        
        // TODO: 모든 지원서의 최종 결과가 확정되었는지 확인 필요
        // 현재는 상태 전이만 수행
        
        audition.setStatus(Audition.AuditionStatus.FINISHED); // FINISHED = FINALIZED
        log.info("오디션 확정: auditionId={}", audition.getId());
    }

    /**
     * 상태 전이 검증
     */
    private void validateTransition(Audition audition, Audition.AuditionStatus expectedStatus, String errorMessage) {
        if (audition.getStatus() != expectedStatus) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, 
                    String.format("%s 현재 상태: %s, 필요 상태: %s", errorMessage, audition.getStatus(), expectedStatus));
        }
    }

    /**
     * 오디션이 지원 가능한 상태인지 확인
     */
    public boolean isOpenForApplication(Audition audition) {
        return audition.getStatus() == Audition.AuditionStatus.ONGOING;
    }

    /**
     * 오디션이 확정된 상태인지 확인
     */
    public boolean isFinalized(Audition audition) {
        return audition.getStatus() == Audition.AuditionStatus.FINISHED;
    }
}
