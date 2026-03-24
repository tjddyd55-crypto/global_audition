package com.audition.platform.application.round;

public final class AuditionProcessModes {

    public static final String SINGLE = "SINGLE";
    public static final String MULTI_ROUND = "MULTI_ROUND";

    private AuditionProcessModes() {
    }

    public static boolean isMultiRound(String processMode) {
        return MULTI_ROUND.equals(processMode);
    }
}
