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

    /**
     * 기획사 지원자 보드 전용 — SUBMITTED→PENDING, ACCEPTED→APPROVED.
     * (DB는 그대로 두고 API/화면만 평가 워딩에 맞춤)
     */
    public static String agencyBoardStatusToApi(String dbStatus) {
        if (dbStatus == null) {
            return "PENDING";
        }
        if ("REVIEWED".equals(dbStatus)) {
            return "REVIEWING";
        }
        if ("SUBMITTED".equals(dbStatus)) {
            return "PENDING";
        }
        if ("ACCEPTED".equals(dbStatus)) {
            return "APPROVED";
        }
        return dbStatus;
    }

    /** PATCH 요청값 → DB 컬럼 값 */
    public static String agencyBoardStatusToDb(String apiStatus) {
        if (apiStatus == null) {
            return null;
        }
        if ("PENDING".equals(apiStatus)) {
            return "SUBMITTED";
        }
        if ("REVIEWING".equals(apiStatus)) {
            return "REVIEWING";
        }
        if ("APPROVED".equals(apiStatus) || "ACCEPTED".equals(apiStatus)) {
            return "ACCEPTED";
        }
        if ("REJECTED".equals(apiStatus)) {
            return "REJECTED";
        }
        return null;
    }

    /** users.role: APPLICANT → auth/profile USER */
    public static String userRoleToApi(String dbRole) {
        if ("APPLICANT".equals(dbRole)) {
            return "USER";
        }
        return dbRole;
    }
}
