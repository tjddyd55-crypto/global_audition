package com.audition.platform.application.channel;

import com.audition.platform.application.channel.PublicChannelDiscoveryService.Row;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class PublicChannelDiscoveryTest {

    private static Row row(String nick, String nat, String res, String[] shown, long subs, long views, Instant created) {
        return new Row(UUID.randomUUID(), nick, null, null, null, nat, res, new String[]{"VOCAL"}, shown, null,
                created, null, subs, 1, views, 0, null, null);
    }

    @Test
    void countryUsesOnlyPublicNationalityOrResidence() {
        Row hiddenNat = row("a", "KR", null, new String[]{"INTRO"}, 0, 0, Instant.EPOCH);
        Row publicRes = row("b", "MN", "KR", new String[]{"RESIDENCE"}, 0, 0, Instant.EPOCH);
        Row legacy = row("c", "KH", null, null, 0, 0, Instant.EPOCH);
        assertFalse(PublicChannelDiscoveryService.countryMatches(hiddenNat, "KR"));
        assertTrue(PublicChannelDiscoveryService.countryMatches(publicRes, "KR"));
        assertFalse(PublicChannelDiscoveryService.countryMatches(publicRes, "MN"), "국적 비공개");
        assertTrue(PublicChannelDiscoveryService.countryMatches(legacy, "KH"));
        assertTrue(PublicChannelDiscoveryService.countryMatches(row("d", "OTHER", null, null, 0, 0, Instant.EPOCH), "OTHER"));
    }

    @Test
    void sortsUseRealCounts() {
        Row old = row("old", "KR", null, null, 5, 10, Instant.parse("2026-01-01T00:00:00Z"));
        Row fresh = row("fresh", "KR", null, null, 0, 500, Instant.parse("2026-11-01T00:00:00Z"));
        List<Row> rows = new ArrayList<>(List.of(old, fresh));
        rows.sort(PublicChannelDiscoveryService.comparator("NEWEST"));
        assertEquals("fresh", rows.get(0).nickname());
        rows.sort(PublicChannelDiscoveryService.comparator("FOLLOWERS"));
        assertEquals("old", rows.get(0).nickname());
        rows.sort(PublicChannelDiscoveryService.comparator("VIEWS"));
        assertEquals("fresh", rows.get(0).nickname());
        rows.sort(PublicChannelDiscoveryService.comparator("POPULAR"));
        assertEquals("fresh", rows.get(0).nickname(), "500 views > 5 subs*20+10");
    }

    @Test
    void legacyFreeTextFieldStillMatches() {
        assertTrue(PublicChannelDiscoveryService.fieldMatches(new String[]{"K-pop 보컬"}, "보컬"));
        assertTrue(PublicChannelDiscoveryService.fieldMatches(new String[]{"보컬"}, "VOCAL"));
    }
}
