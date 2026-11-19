package com.audition.platform.application.casting;

import java.util.Map;
import java.util.Set;

/**
 * 캐스팅 제안 상태와 서버 전이 규칙.
 * SENT → READ(지원자 열람) → ACCEPTED/DECLINED(지원자), SENT/READ → WITHDRAWN(기획사), SENT/READ → EXPIRED(기한 경과).
 * 수락은 관심 표시일 뿐 계약·지원·결제·크레딧을 만들지 않는다.
 */
public final class CastingOfferStatus {

    public static final String SENT = "SENT";
    public static final String READ = "READ";
    public static final String ACCEPTED = "ACCEPTED";
    public static final String DECLINED = "DECLINED";
    public static final String EXPIRED = "EXPIRED";
    public static final String WITHDRAWN = "WITHDRAWN";

    public static final String ACTOR_TALENT = "TALENT";
    public static final String ACTOR_AGENCY = "AGENCY";
    public static final String ACTOR_SYSTEM = "SYSTEM";

    public static final Set<String> OPEN = Set.of(SENT, READ);
    public static final Set<String> ALL = Set.of(SENT, READ, ACCEPTED, DECLINED, EXPIRED, WITHDRAWN);

    private static final Map<String, Set<String>> TALENT = Map.of(
            SENT, Set.of(READ, ACCEPTED, DECLINED),
            READ, Set.of(ACCEPTED, DECLINED));
    private static final Map<String, Set<String>> AGENCY = Map.of(
            SENT, Set.of(WITHDRAWN),
            READ, Set.of(WITHDRAWN));
    private static final Map<String, Set<String>> SYSTEM = Map.of(
            SENT, Set.of(EXPIRED),
            READ, Set.of(EXPIRED));

    private CastingOfferStatus() {
    }

    public static boolean canTransition(String from, String to, String actor) {
        Map<String, Set<String>> rules = switch (actor) {
            case ACTOR_TALENT -> TALENT;
            case ACTOR_AGENCY -> AGENCY;
            case ACTOR_SYSTEM -> SYSTEM;
            default -> Map.of();
        };
        return rules.getOrDefault(from, Set.of()).contains(to);
    }

    public static boolean open(String status) {
        return OPEN.contains(status);
    }
}
