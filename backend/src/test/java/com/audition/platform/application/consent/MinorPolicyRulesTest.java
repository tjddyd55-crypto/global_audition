package com.audition.platform.application.consent;

import com.audition.platform.application.casting.CastingRules;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/** 국가별 정책 판정(하드코딩 없음)과 미성년자 제안 본문 연락처 감지. */
class MinorPolicyRulesTest {

    private static final MinorPolicyService.Policy KR = new MinorPolicyService.Policy("KR", 19, 14, true, true, false, null, null);
    private static final MinorPolicyService.Policy US = new MinorPolicyService.Policy("US", 18, 13, true, true, false, null, null);
    private static final MinorPolicyService.Policy DEF = new MinorPolicyService.Policy("DEFAULT", 18, 18, true, true, false, null, null);

    private static LocalDate age(int years) {
        return LocalDate.now(java.time.ZoneOffset.UTC).minusYears(years).minusDays(1);
    }

    @Test
    void policyResolvesPerCountryWithDefaultFallback() {
        Map<String, MinorPolicyService.Policy> all = Map.of("KR", KR, "US", US, "DEFAULT", DEF);
        assertEquals("KR", MinorPolicyService.resolvePolicy(all, "kr").countryCode());
        assertEquals("DEFAULT", MinorPolicyService.resolvePolicy(all, "MN").countryCode());
        assertEquals("DEFAULT", MinorPolicyService.resolvePolicy(all, null).countryCode());
        assertEquals("KR", MinorPolicyService.policyCountry(null, "KR", "MN"));
        assertEquals("MN", MinorPolicyService.policyCountry(" ", "OTHER", "mn"));
    }

    @Test
    void minorsAreNotBlockedOnlyGuardianGated() {
        MinorPolicyService.Status kr18 = MinorPolicyService.evaluate(age(18), KR, false);
        assertTrue(kr18.minor(), "KR 성년 19세");
        assertFalse(kr18.guardianLegallyRequired());
        assertTrue(kr18.applyAllowed());
        assertTrue(kr18.searchAllowed());
        assertFalse(kr18.offersAllowed());
        assertEquals("CASTING_GUARDIAN_REQUIRED", kr18.offersBlockReason());
        assertTrue(MinorPolicyService.evaluate(age(18), KR, true).offersAllowed());
        assertTrue(MinorPolicyService.evaluate(age(18), US, false).offersAllowed(), "US 18세는 성인");

        MinorPolicyService.Status kr12 = MinorPolicyService.evaluate(age(12), KR, false);
        assertTrue(kr12.guardianLegallyRequired());
        assertFalse(kr12.applyAllowed());
        assertFalse(kr12.searchAllowed());
        MinorPolicyService.Status kr12g = MinorPolicyService.evaluate(age(12), KR, true);
        assertTrue(kr12g.applyAllowed() && kr12g.searchAllowed() && kr12g.offersAllowed());
        assertFalse(kr12g.contactSharingAllowed(), "보호자 확인이 있어도 연락처 공유는 정책 허용 전까지 불가");

        MinorPolicyService.Status unknown = MinorPolicyService.evaluate(null, KR, false);
        assertFalse(unknown.offersAllowed());
        assertEquals("CASTING_BIRTH_DATE_REQUIRED", unknown.offersBlockReason());
        assertTrue(unknown.applyAllowed(), "기존 회원(생년월일 없음)의 지원은 막지 않는다");

        MinorPolicyService.Status adult = MinorPolicyService.evaluate(age(30), KR, false);
        assertTrue(adult.offersAllowed() && adult.contactSharingAllowed());
    }

    @Test
    void contactTextDetection() {
        assertTrue(CastingRules.containsContact("연락 010-1234-5678"));
        assertTrue(CastingRules.containsContact("+976 9911 2233"));
        assertTrue(CastingRules.containsContact("mail me: a.b@example.com"));
        assertTrue(CastingRules.containsContact("https://open.kakao.com/x"));
        assertTrue(CastingRules.containsContact("www.agency-site.com"));
        assertFalse(CastingRules.containsContact("2027년 3월 서울 촬영, 보상 협의"));
        assertFalse(CastingRules.containsContact("오디션 1차 10명 선발"));
        assertFalse(CastingRules.containsContact((String) null));
    }
}
