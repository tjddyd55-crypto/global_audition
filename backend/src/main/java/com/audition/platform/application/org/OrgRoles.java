package com.audition.platform.application.org;

/**
 * SUPER_ADMIN 이 본사 최고 관리자다. GLOBAL_SUPER_ADMIN 은 같은 권한의 옛 별칭이며 새 계정을 만들지 않는다.
 * AGENCY_ADMIN 은 AGENCY 와 같은 자기 기획사 범위의 별칭이다. 국가별 로그인 체계는 만들지 않는다.
 */
public final class OrgRoles {

    public static final String SUPER_ADMIN = "SUPER_ADMIN";
    public static final String GLOBAL_SUPER_ADMIN = "GLOBAL_SUPER_ADMIN";
    public static final String COUNTRY_ADMIN = "COUNTRY_ADMIN";
    public static final String COUNTRY_STAFF = "COUNTRY_STAFF";
    public static final String AGENCY = "AGENCY";
    public static final String AGENCY_ADMIN = "AGENCY_ADMIN";

    public static final String PERM_CRM_READ = "CRM_READ";
    public static final String PERM_CRM_WRITE = "CRM_WRITE";
    public static final String PERM_CONSULT_LOG = "CONSULT_LOG";
    public static final String PERM_AGENCY_REVIEW = "AGENCY_REVIEW";
    public static final String PERM_CONTRACT_TERMS = "CONTRACT_TERMS";
    public static final String PERM_SETTLEMENT_APPROVE = "SETTLEMENT_APPROVE";
    public static final String PERM_RATE_EDIT = "RATE_EDIT";

    private OrgRoles() {
    }

    public static boolean hq(String role) {
        return SUPER_ADMIN.equals(role) || GLOBAL_SUPER_ADMIN.equals(role);
    }

    public static boolean countryAdmin(String role) {
        return COUNTRY_ADMIN.equals(role);
    }

    public static boolean countryStaff(String role) {
        return COUNTRY_STAFF.equals(role);
    }

    public static boolean agencyOperator(String role) {
        return AGENCY.equals(role) || AGENCY_ADMIN.equals(role);
    }
}
