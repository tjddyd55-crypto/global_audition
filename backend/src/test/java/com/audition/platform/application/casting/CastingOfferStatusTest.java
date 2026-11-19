package com.audition.platform.application.casting;

import org.junit.jupiter.api.Test;

import static com.audition.platform.application.casting.CastingOfferStatus.*;
import static org.assertj.core.api.Assertions.assertThat;

class CastingOfferStatusTest {

    @Test
    void talentCanReadAcceptDeclineOnlyOpenOffers() {
        assertThat(canTransition(SENT, READ, ACTOR_TALENT)).isTrue();
        assertThat(canTransition(SENT, ACCEPTED, ACTOR_TALENT)).isTrue();
        assertThat(canTransition(READ, DECLINED, ACTOR_TALENT)).isTrue();
        assertThat(canTransition(ACCEPTED, DECLINED, ACTOR_TALENT)).isFalse();
        assertThat(canTransition(EXPIRED, ACCEPTED, ACTOR_TALENT)).isFalse();
        assertThat(canTransition(WITHDRAWN, ACCEPTED, ACTOR_TALENT)).isFalse();
        assertThat(canTransition(SENT, WITHDRAWN, ACTOR_TALENT)).isFalse();
    }

    @Test
    void agencyCanOnlyWithdrawOpenOffers() {
        assertThat(canTransition(SENT, WITHDRAWN, ACTOR_AGENCY)).isTrue();
        assertThat(canTransition(READ, WITHDRAWN, ACTOR_AGENCY)).isTrue();
        assertThat(canTransition(ACCEPTED, WITHDRAWN, ACTOR_AGENCY)).isFalse();
        assertThat(canTransition(SENT, ACCEPTED, ACTOR_AGENCY)).isFalse();
    }

    @Test
    void systemOnlyExpiresOpenOffers() {
        assertThat(canTransition(SENT, EXPIRED, ACTOR_SYSTEM)).isTrue();
        assertThat(canTransition(READ, EXPIRED, ACTOR_SYSTEM)).isTrue();
        assertThat(canTransition(DECLINED, EXPIRED, ACTOR_SYSTEM)).isFalse();
        assertThat(canTransition(SENT, READ, "ADMIN")).isFalse();
    }

    @Test
    void notificationKeysAreCamelCase() {
        assertThat(UserNotificationService.camel("CASTING_OFFER_NEW")).isEqualTo("castingOfferNew");
        assertThat(UserNotificationService.camel("CHANNEL_NEW_VIDEO")).isEqualTo("channelNewVideo");
        assertThat(CastingAdminService.rate(1, 3)).isEqualTo(33.3);
        assertThat(CastingAdminService.rate(0, 0)).isEqualTo(0.0);
    }
}
