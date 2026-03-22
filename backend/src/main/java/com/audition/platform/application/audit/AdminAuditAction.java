package com.audition.platform.application.audit;

/**
 * {@code admin_logs.action} 값.
 */
public final class AdminAuditAction {

    public static final String CREDIT_GRANT = "CREDIT_GRANT";
    public static final String CREDIT_GRANT_BULK = "CREDIT_GRANT_BULK";
    public static final String CREDIT_ADJUST = "CREDIT_ADJUST";
    public static final String CREDIT_POLICY_PATCH = "CREDIT_POLICY_PATCH";
    public static final String USER_UPDATE = "USER_UPDATE";

    private AdminAuditAction() {
    }
}
