package com.audition.platform.application.service;

import com.audition.platform.application.dto.UserSummaryDto;
import com.audition.platform.domain.entity.BusinessProfile;
import com.audition.platform.domain.entity.User;
import com.audition.platform.domain.repository.BusinessProfileRepository;
import com.audition.platform.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 내부 API용 사용자 서비스
 * 다른 서비스에서 사용자 정보를 조회할 때 사용
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InternalUserService {

    private final UserRepository userRepository;
    private final BusinessProfileRepository businessProfileRepository;

    /**
     * 사용자 요약 정보 조회
     * 내부 API용 - 다른 서비스에서 사용자 기본 정보가 필요할 때 호출
     * 
     * @param userId 사용자 ID
     * @return 사용자 요약 정보 (이름, 기획사명, 프로필 이미지)
     */
    public UserSummaryDto getUserSummary(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + userId));

        // 기획사인 경우 기획사명 조회 (STEP 1: AGENCY도 포함)
        String businessName = null;
        if (user.getUserType() == User.UserType.BUSINESS || user.getUserType() == User.UserType.AGENCY) {
            businessName = businessProfileRepository.findByUserId(userId)
                    .map(businessProfile -> businessProfile.getCompanyName())
                    .orElse(null);
        }

        // STEP 1: role 매핑 (BUSINESS → AGENCY로 통일)
        String role = user.getUserType().name();
        if (role.equals("BUSINESS")) {
            role = "AGENCY"; // 하위 호환성: BUSINESS를 AGENCY로 매핑
        }

        return UserSummaryDto.builder()
                .userId(user.getId())
                .userName(user.getName())
                .role(role) // STEP 1: role 추가
                .businessName(businessName)
                .profileImageUrl(user.getProfileImageUrl())
                .build();
    }
}
