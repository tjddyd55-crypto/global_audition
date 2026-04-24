package com.audition.platform.application.applications;

import com.audition.platform.api.dto.ManageApplicationsPageDataDto;
import com.audition.platform.application.ApplicationService;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * 기획사/관리자 지원자 관리 보드 조회 유스케이스 경계.
 *
 * <p>현재는 기존 {@link ApplicationService#listManageApplications(UUID, String, Integer, Integer, String, Boolean, String, Integer)}
 * 로직에 위임해 동작을 보존한다. 다음 단계에서 통계, 차수, 필터링, 카드 DTO 조립 로직을 이 서비스로 이동한다.</p>
 */
@Service
public class ManageApplicationsQueryService {

    private final ApplicationService applicationService;

    public ManageApplicationsQueryService(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    public ManageApplicationsPageDataDto listManageApplications(
            UUID auditionId,
            String category,
            Integer minAge,
            Integer maxAge,
            String nationality,
            Boolean hasSns,
            String boardStatus,
            Integer round) {
        return applicationService.listManageApplications(
                auditionId, category, minAge, maxAge, nationality, hasSns, boardStatus, round);
    }
}
