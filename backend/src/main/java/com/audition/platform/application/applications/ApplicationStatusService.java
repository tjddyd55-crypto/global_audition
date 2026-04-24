package com.audition.platform.application.applications;

import com.audition.platform.api.dto.ApplicationStatusPatchDataDto;
import com.audition.platform.application.me.MeApiMapping;
import com.audition.platform.application.ranking.ApplicationRankingService;
import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.ApplicationStatusHistory;
import com.audition.platform.domain.audition.ApplicationStatusHistoryRepository;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.UUID;

/**
 * 지원 상태 변경 유스케이스.
 *
 * <p>상태값 매핑, 히스토리 기록, 랭킹 재계산을 담당한다.</p>
 */
@Service
public class ApplicationStatusService {

    private final ApplicationRepository applicationRepository;
    private final AuditionRepository auditionRepository;
    private final ApplicationStatusHistoryRepository applicationStatusHistoryRepository;
    private final ApplicationRankingService applicationRankingService;

    public ApplicationStatusService(
            ApplicationRepository applicationRepository,
            AuditionRepository auditionRepository,
            ApplicationStatusHistoryRepository applicationStatusHistoryRepository,
            ApplicationRankingService applicationRankingService) {
        this.applicationRepository = applicationRepository;
        this.auditionRepository = auditionRepository;
        this.applicationStatusHistoryRepository = applicationStatusHistoryRepository;
        this.applicationRankingService = applicationRankingService;
    }

    @Transactional
    public ApplicationStatusPatchDataDto patchApplicationStatus(UUID id, String status) {
        String dbTarget = MeApiMapping.agencyBoardStatusToDb(status.trim());
        if (dbTarget == null) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "유효하지 않은 상태입니다.");
        }
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        Application app = applicationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "지원서를 찾을 수 없습니다."));
        Audition audition = auditionRepository.findById(app.getAuditionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "오디션을 찾을 수 없습니다."));
        assertAgencyOrAdminCanManageAudition(audition);

        if (!"REVIEWING".equals(dbTarget)
                && !"ACCEPTED".equals(dbTarget)
                && !"REJECTED".equals(dbTarget)
                && !"SUBMITTED".equals(dbTarget)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "유효하지 않은 상태입니다.");
        }

        String previousDb = app.getStatus();
        app.setStatus(dbTarget);
        app.setUpdatedAt(Instant.now());
        app = applicationRepository.save(app);
        recordApplicationStatusChange(id, previousDb, dbTarget, currentUserId);
        applicationRankingService.recalculateScores(app.getAuditionId());
        return new ApplicationStatusPatchDataDto(
                app.getId().toString(),
                MeApiMapping.agencyBoardStatusToApi(app.getStatus())
        );
    }

    private void assertAgencyOrAdminCanManageAudition(Audition audition) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        if (SecurityUtils.hasRole("APPLICANT")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "지원자는 이 작업을 수행할 수 없습니다.");
        }
        if (!audition.getOwnerId().equals(currentUserId) && !SecurityUtils.hasRole("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "해당 오디션을 관리할 권한이 없습니다.");
        }
    }

    private void recordApplicationStatusChange(
            UUID applicationId, String previousDb, String nextDb, UUID actorId) {
        ApplicationStatusHistory row = new ApplicationStatusHistory();
        row.setApplicationId(applicationId);
        row.setPreviousStatus(previousDb != null ? previousDb : "");
        row.setNextStatus(nextDb);
        row.setChangedBy(actorId);
        row.setChangedAt(Instant.now());
        applicationStatusHistoryRepository.save(row);
    }
}
