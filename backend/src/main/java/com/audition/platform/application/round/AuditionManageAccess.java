package com.audition.platform.application.round;

import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

/**
 * 기획사/관리자 오디션 관리 권한 — 라운드·심사 API 공통.
 */
@Component
public class AuditionManageAccess {

    private final AuditionRepository auditionRepository;

    public AuditionManageAccess(AuditionRepository auditionRepository) {
        this.auditionRepository = auditionRepository;
    }

    public Audition requireManagedAudition(UUID auditionId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        if (SecurityUtils.hasRole("APPLICANT")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "지원자는 이 작업을 수행할 수 없습니다.");
        }
        Audition audition = auditionRepository.findById(auditionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "오디션을 찾을 수 없습니다."));
        if (!audition.getOwnerId().equals(currentUserId) && !SecurityUtils.hasRole("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "해당 오디션을 관리할 권한이 없습니다.");
        }
        return audition;
    }
}
