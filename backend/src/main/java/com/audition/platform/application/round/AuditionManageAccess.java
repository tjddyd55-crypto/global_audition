package com.audition.platform.application.round;

import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

/**
 * 기획사/관리자 오디션 권한.
 *
 * <p>변경(회차 생성·개폐, 합격/불합격/보류)은 {@link #requireManagedAudition} 만 사용한다.
 * 그 경로는 소유 기획사와 role ADMIN 만 허용하며 SUPER_ADMIN 을 넣지 않는다.</p>
 *
 * <p>조회는 {@link #requireReadableAudition} / {@link #assertCanRead} 만 사용한다.
 * 여기에만 DB role SUPER_ADMIN 을 더한다. 국가·기획사 할당 테이블은 없고,
 * role ADMIN 은 기존처럼 국가와 무관하게 통과한다.</p>
 */
@Component
public class AuditionManageAccess {

    private final AuditionRepository auditionRepository;

    public AuditionManageAccess(AuditionRepository auditionRepository) {
        this.auditionRepository = auditionRepository;
    }

    /** 심사·상태 변경. SUPER_ADMIN 을 허용하지 않는다. */
    public Audition requireManagedAudition(UUID auditionId) {
        return loadAuthorized(auditionId, false);
    }

    /** 회차 목록·회차 결과 조회. 소유 기획사, ADMIN, SUPER_ADMIN. */
    public Audition requireReadableAudition(UUID auditionId) {
        return loadAuthorized(auditionId, true);
    }

    /** 이미 로드한 오디션의 지원서 상세 조회. */
    public void assertCanRead(Audition audition) {
        UUID currentUserId = requireActor();
        assertAllowed(currentUserId, audition, true);
    }

    private Audition loadAuthorized(UUID auditionId, boolean includeSuperAdminRead) {
        UUID currentUserId = requireActor();
        Audition audition = auditionRepository.findById(auditionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "오디션을 찾을 수 없습니다."));
        assertAllowed(currentUserId, audition, includeSuperAdminRead);
        return audition;
    }

    private static UUID requireActor() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        if (SecurityUtils.hasRole("APPLICANT")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "지원자는 이 작업을 수행할 수 없습니다.");
        }
        return currentUserId;
    }

    private static void assertAllowed(UUID currentUserId, Audition audition, boolean includeSuperAdminRead) {
        if (audition.getOwnerId().equals(currentUserId) || SecurityUtils.hasRole("ADMIN")) {
            return;
        }
        if (includeSuperAdminRead && SecurityUtils.hasRole("SUPER_ADMIN")) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "해당 오디션을 관리할 권한이 없습니다.");
    }
}
