package com.audition.platform.application.org;

import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * 국가 관리자의 지원서 조회 범위.
 *
 * <p>역할과 활성 임명은 요청마다 DB 에서 읽는다. 토큰 클레임은 보지 않는다.
 * 공고 범위는 {@code CountryWorkspaceService#auditions} 와 같다.
 * 게시 지점 {@code crm_agencies.country_code} 가 그 사용자의 ACTIVE
 * {@code country_admin_appointments} 국가 중 하나와 같을 때만 허용한다.
 * 임명이 여러 국가이면 전부 본다. 지점이 없으면 추정하지 않는다.
 * 지원자 국적, 거주국가, 모집 대상 {@code auditions.country_code} 는 쓰지 않는다.</p>
 */
@Component
public class CountryAdminAuditionRead {

    private final OrgDirectory directory;
    private final JdbcCrmStore crm;

    public CountryAdminAuditionRead(OrgDirectory directory, JdbcCrmStore crm) {
        this.directory = directory;
        this.crm = crm;
    }

    public boolean allows(UUID userId, UUID auditionId) {
        if (userId == null || auditionId == null) {
            return false;
        }
        if (!OrgRoles.COUNTRY_ADMIN.equals(roleOf(userId))) {
            return false;
        }
        return crm.postingBranchCoveredByActiveRep(auditionId, userId);
    }

    private String roleOf(UUID userId) {
        String role = directory.roleOf(userId);
        return role == null ? null : role.trim();
    }
}
