package com.audition.platform.application.notifications;

/** 앱 내부 알림 수신 설정. 행이 없으면 전부 허용. */
public record NotificationSettings(boolean savedDeadline, boolean newMatch, boolean results, boolean offers) {

    public static NotificationSettings defaults() {
        return new NotificationSettings(true, true, true, true);
    }

    public boolean allows(String type) {
        if (type == null) {
            return true;
        }
        return switch (category(type)) {
            case SAVED_DEADLINE -> savedDeadline;
            case NEW_MATCH -> newMatch;
            case RESULTS -> results;
            case OFFERS -> offers;
            case OTHER -> true;
        };
    }

    public enum Category { SAVED_DEADLINE, NEW_MATCH, RESULTS, OFFERS, OTHER }

    public static Category category(String type) {
        if (type == null) {
            return Category.OTHER;
        }
        return switch (type) {
            case "SAVED_AUDITION_DEADLINE" -> Category.SAVED_DEADLINE;
            case "NEW_MATCHING_AUDITION" -> Category.NEW_MATCH;
            case "APPLICATION_RESULT", "PASS_NOTICE", "FAIL_NOTICE", "FINAL_NOTICE", "ROUND_OPEN",
                    "SINGLE_STAGE_PASS", "SINGLE_STAGE_FAIL" -> Category.RESULTS;
            default -> type.startsWith("CASTING_OFFER_") ? Category.OFFERS : Category.OTHER;
        };
    }
}
