package com.audition.platform.application.applications;

import com.audition.platform.api.dto.ApplicationResponse;
import com.audition.platform.api.dto.CreateApplicationRequest;
import com.audition.platform.application.ApplicationService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

/**
 * 지원자 관점의 지원서 제출/조회 유스케이스 경계.
 *
 * <p>현재는 기존 {@link ApplicationService} 로직을 위임해 API 동작을 보존한다.
 * 이후 submitApplication 내부 검증/저장 로직은 이 서비스로 점진 이동한다.</p>
 */
@Service
public class ApplicationSubmitService {

    private final ApplicationService applicationService;

    public ApplicationSubmitService(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    public ApplicationResponse apply(UUID auditionId) {
        return applicationService.apply(auditionId);
    }

    public ApplicationResponse submitApplication(CreateApplicationRequest body) {
        return applicationService.submitApplication(body);
    }

    public List<ApplicationResponse> listMyApplications() {
        return applicationService.listMyApplications();
    }

    public ApplicationResponse getApplicationForApplicantOrOwner(UUID id) {
        return applicationService.getApplicationForApplicantOrOwner(id);
    }
}
