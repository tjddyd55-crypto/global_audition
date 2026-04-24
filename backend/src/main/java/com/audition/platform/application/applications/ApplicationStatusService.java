package com.audition.platform.application.applications;

import com.audition.platform.api.dto.ApplicationStatusPatchDataDto;
import com.audition.platform.application.ApplicationService;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * 지원 상태 변경 유스케이스 경계.
 *
 * <p>상태값 매핑, 히스토리 기록, 랭킹 재계산은 향후 이 서비스로 이동한다.
 * 현재는 기존 API 안정성을 위해 {@link ApplicationService} 에 위임한다.</p>
 */
@Service
public class ApplicationStatusService {

    private final ApplicationService applicationService;

    public ApplicationStatusService(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    public ApplicationStatusPatchDataDto patchApplicationStatus(UUID id, String status) {
        return applicationService.patchApplicationStatus(id, status);
    }
}
