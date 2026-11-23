package com.audition.platform.application.notifications;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NotificationSettingsTest {

    @Test
    void defaultsAllowEveryCategoryAndOffTogglesOnlyTheirTypes() {
        NotificationSettings all = NotificationSettings.defaults();
        assertTrue(all.allows("SAVED_AUDITION_DEADLINE"));
        assertTrue(all.allows("NEW_MATCHING_AUDITION"));
        assertTrue(all.allows("PASS_NOTICE"));
        assertTrue(all.allows("CASTING_OFFER_NEW"));
        assertTrue(all.allows("CHANNEL_NEW_VIDEO"));

        NotificationSettings off = new NotificationSettings(false, false, false, false);
        assertFalse(off.allows("SAVED_AUDITION_DEADLINE"));
        assertFalse(off.allows("NEW_MATCHING_AUDITION"));
        assertFalse(off.allows("APPLICATION_RESULT"));
        assertFalse(off.allows("CASTING_OFFER_DEADLINE"));
        assertTrue(off.allows("CHANNEL_NEW_VIDEO"));
    }

    @Test
    void remainingDaysUsesUtcCalendarDatesForD3AndD1() {
        LocalDate today = LocalDate.of(2026, 11, 23);
        assertEquals(3, InAppNotificationFanout.remainingDays(today, Instant.parse("2026-11-26T01:00:00Z")));
        assertEquals(1, InAppNotificationFanout.remainingDays(today, Instant.parse("2026-11-24T23:00:00Z")));
        assertEquals(0, InAppNotificationFanout.remainingDays(today, Instant.parse("2026-11-23T15:00:00Z")));
        assertEquals(-1, InAppNotificationFanout.remainingDays(today, null));
    }

    @Test
    void countryAndFieldMatchDoNotTreatLanguageCodesAsAutomaticHits() {
        var user = new InAppNotificationFanout.MatchUser(null, "KR", "MN", "MN", null, new String[]{"DANCE"});
        assertTrue(InAppNotificationFanout.countryMatches("GLOBAL", user));
        assertTrue(InAppNotificationFanout.countryMatches("MN", user));
        assertTrue(InAppNotificationFanout.countryMatches("KR", user));
        assertFalse(InAppNotificationFanout.countryMatches("KH", user));
        assertTrue(InAppNotificationFanout.fieldMatches(new String[]{"DANCE", "VOCAL"}, new String[]{"dance"}));
        assertFalse(InAppNotificationFanout.fieldMatches(new String[]{"VOCAL"}, new String[]{"DANCE"}));
    }
}
