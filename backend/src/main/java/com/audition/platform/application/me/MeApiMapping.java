package com.audition.platform.application.me;

/**
 * DB 값 ↔ 화면/API SSOT enum 매핑
 */
public final class MeApiMapping {

    private MeApiMapping() {}

    /** DB REVIEWING → API REVIEWING (레거시 DB 값 REVIEWED는 마이그레이션 후 없음, 방어적 매핑 유지) */
    public static String applicationStatusToApi(String dbStatus) {
        if ("REVIEWED".equals(dbStatus)) {
            return "REVIEWING";
        }
        return dbStatus;
    }

    /** users.role: APPLICANT → auth/profile USER */
    public static String userRoleToApi(String dbRole) {
        if ("APPLICANT".equals(dbRole)) {
            return "USER";
        }
        return dbRole;
    }
}
