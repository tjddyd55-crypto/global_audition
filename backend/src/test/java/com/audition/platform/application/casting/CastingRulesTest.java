package com.audition.platform.application.casting;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CastingRulesTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 11, 19);

    private static CastingRules.OfferInput input(String title, String project, String field, String comp,
                                                 String country, LocalDate deadline) {
        return new CastingRules.OfferInput(UUID.randomUUID(), null, title, project, field, "안녕하세요, 제안드립니다.",
                country, "Seoul", "2027-01", comp, null, null, deadline, true, "ko");
    }

    @Test
    void cleansValidOfferWithDefaults() {
        CastingRules.CleanOffer c = CastingRules.clean(input("  보컬 오디션 초대  ", "audition_invite", "VOCAL", null, "kr", null), TODAY);
        assertThat(c.title()).isEqualTo("보컬 오디션 초대");
        assertThat(c.projectType()).isEqualTo("AUDITION_INVITE");
        assertThat(c.compensationType()).isEqualTo("TBD");
        assertThat(c.workCountry()).isEqualTo("KR");
        assertThat(c.contactRequested()).isTrue();
        assertThat(c.expiresAt().atZone(ZoneOffset.UTC).toLocalDate()).isEqualTo(TODAY.plusDays(14));
    }

    @Test
    void rejectsMissingOrInvalidFields() {
        assertCode(() -> CastingRules.clean(input(" ", "PROJECT", "VOCAL", "PAID", null, null), TODAY), "OFFER_TITLE_REQUIRED");
        assertCode(() -> CastingRules.clean(input("t", "CONTRACT", "VOCAL", "PAID", null, null), TODAY), "OFFER_PROJECT_TYPE_INVALID");
        assertCode(() -> CastingRules.clean(input("t", "PROJECT", "보컬노래", "PAID", null, null), TODAY), "OFFER_FIELD_INVALID");
        assertCode(() -> CastingRules.clean(input("t", "PROJECT", "VOCAL", "CASH", null, null), TODAY), "OFFER_COMPENSATION_INVALID");
        assertCode(() -> CastingRules.clean(input("t", "PROJECT", "VOCAL", "PAID", "US", null), TODAY), "OFFER_COUNTRY_INVALID");
        assertCode(() -> CastingRules.clean(input("t", "PROJECT", "VOCAL", "PAID", null, TODAY), TODAY), "OFFER_DEADLINE_INVALID");
        assertCode(() -> CastingRules.clean(input("t", "PROJECT", "VOCAL", "PAID", null, TODAY.plusDays(31)), TODAY), "OFFER_DEADLINE_INVALID");
        assertCode(() -> CastingRules.clean(null, TODAY), "OFFER_TALENT_REQUIRED");
    }

    @Test
    void reasonsAreWhitelisted() {
        assertThat(CastingRules.reportReason("external_payment")).isEqualTo("EXTERNAL_PAYMENT");
        assertCode(() -> CastingRules.reportReason("whatever"), null);
        assertThat(CastingRules.declineReason("schedule")).isEqualTo("SCHEDULE");
    }

    private static void assertCode(Runnable r, String code) {
        assertThatThrownBy(r::run).isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> {
                    if (code != null) {
                        assertThat(((ResponseStatusException) e).getReason()).isEqualTo(code);
                    }
                });
    }
}
