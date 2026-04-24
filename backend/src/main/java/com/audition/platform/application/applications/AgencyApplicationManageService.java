package com.audition.platform.application.applications;

import com.audition.platform.api.dto.AgencyApplicantsListDto;
import com.audition.platform.api.dto.ApplicationAgencyDetailDto;
import com.audition.platform.api.dto.ApplicationResponse;
import com.audition.platform.api.dto.ManageApplicationsPageDataDto;
import com.audition.platform.application.ApplicationService;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * 기획사/관리자 관점의 지원자 관리 유스케이스 경계.
 *
 * <p>목록, 상세, 심사 보드 필터링 로직은 향후 이 서비스로 이동한다.
 * 현재는 기존 API 안정성을 위해 {@link ApplicationService} 에 위임한다.</p>
 */
@Service
public class AgencyApplicationManageService {

    private final ApplicationService applicationService;

    public AgencyApplicationManageService(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    public AgencyApplicantsListDto listAgencyApplicants(UUID auditionId) {
        return applicationService.listAgencyApplicants(auditionId);
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

    public ApplicationAgencyDetailDto getApplicationAgencyDetail(UUID id) {
        return applicationService.getApplicationAgencyDetail(id);
    }

    public ApplicationResponse decide(UUID id, String status) {
        return applicationService.decide(id, status);
    }

    public ApplicationResponse markReviewed(UUID id) {
        return applicationService.markReviewed(id);
    }
}
