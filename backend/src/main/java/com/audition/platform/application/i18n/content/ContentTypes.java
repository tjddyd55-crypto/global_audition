package com.audition.platform.application.i18n.content;

public final class ContentTypes {

    public static final String APPLICATION_INTRO = "APPLICATION_INTRO";
    public static final String USER_INTRO = "USER_INTRO";
    public static final String AGENCY_PROFILE = "AGENCY_PROFILE";
    public static final String CHANNEL_DESCRIPTION = "CHANNEL_DESCRIPTION";
    public static final String CHANNEL_VIDEO = "CHANNEL_VIDEO";
    public static final String APPLICATION_VIDEO = "APPLICATION_VIDEO";
    public static final String AUDITION_ROUND = "AUDITION_ROUND";

    public static final String NOT_CONFIGURED = "NOT_CONFIGURED";
    public static final String BLOCKED = "BLOCKED";
    public static final String QUOTA_EXCEEDED = "QUOTA_EXCEEDED";
    public static final String RATE_LIMITED = "RATE_LIMITED";
    public static final String ABUSE_BLOCKED = "ABUSE_BLOCKED";
    public static final String LOCALE_UNSUPPORTED = "LOCALE_UNSUPPORTED";
    public static final String TRANSLATION_PROTECTED = "TRANSLATION_PROTECTED";
    public static final String RETRY_EXHAUSTED = "RETRY_EXHAUSTED";
    public static final String CONTENT_NOT_FOUND = "CONTENT_NOT_FOUND";
    public static final String CONCURRENT_EDIT = "CONCURRENT_EDIT";

    public static final String JOB_PENDING = "PENDING";
    public static final String JOB_RUNNING = "RUNNING";
    public static final String JOB_COMPLETED = "COMPLETED";
    public static final String JOB_FAILED = "FAILED";
    public static final String JOB_BLOCKED = "BLOCKED";

    private ContentTypes() {
    }

    public static boolean terminal(String status) {
        return JOB_COMPLETED.equals(status) || JOB_FAILED.equals(status) || JOB_BLOCKED.equals(status);
    }
}
