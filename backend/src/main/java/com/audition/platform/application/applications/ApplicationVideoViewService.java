package com.audition.platform.application.applications;

import com.audition.platform.application.ApplicationService;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * 지원 영상 조회수 증가 유스케이스 경계.
 *
 * <p>대표 영상 조회, view_count 증가, 랭킹 재계산 로직은 향후 이 서비스로 이동한다.
 * 현재는 기존 API 안정성을 위해 {@link ApplicationService} 에 위임한다.</p>
 */
@Service
public class ApplicationVideoViewService {

    private final ApplicationService applicationService;

    public ApplicationVideoViewService(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    public void incrementRepresentativeVideoView(UUID id) {
        applicationService.incrementRepresentativeVideoView(id);
    }
}
