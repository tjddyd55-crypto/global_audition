package com.audition.platform.application.org;

/**
 * 기존 역할과 공존한다. SUPER_ADMIN 은 본사 권한을 유지하고 GLOBAL_SUPER_ADMIN 과 같은 범위다.
 * AGENCY 는 AGENCY_ADMIN 과 같은 자기 기획사 범위다. 국가별 로그인 체계는 만들지 않는다.
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
