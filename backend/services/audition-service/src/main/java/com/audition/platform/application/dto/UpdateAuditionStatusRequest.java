package com.audition.platform.application.dto;

import com.audition.platform.domain.entity.Audition;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 오디션 상태 변경 요청
 * 작업: MVP_01_audition_execution
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAuditionStatusRequest {
    private Audition.AuditionStatus status; // OPEN, CLOSED, FINALIZED
}
