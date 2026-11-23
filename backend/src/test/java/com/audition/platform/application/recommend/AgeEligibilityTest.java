package com.audition.platform.application.recommend;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class AgeEligibilityTest {

    @Test
    void koreanMinAndExclusiveMax() {
        AgeEligibility.Range range = AgeEligibility.parse(new String[] {"만 14세 이상", "만 19세 미만"});
        assertEquals(14, range.minInclusive());
        assertEquals(18, range.maxInclusive());
        assertEquals(AgeEligibility.Status.ELIGIBLE, AgeEligibility.evaluate(new String[] {"만 14세 이상", "만 19세 미만"}, 14));
        assertEquals(AgeEligibility.Status.ELIGIBLE, AgeEligibility.evaluate(new String[] {"만 14세 이상", "만 19세 미만"}, 18));
        assertEquals(AgeEligibility.Status.INELIGIBLE, AgeEligibility.evaluate(new String[] {"만 14세 이상", "만 19세 미만"}, 13));
        assertEquals(AgeEligibility.Status.INELIGIBLE, AgeEligibility.evaluate(new String[] {"만 14세 이상", "만 19세 미만"}, 19));
    }

    @Test
    void numericRangeAndEnglishMin() {
        AgeEligibility.Range span = AgeEligibility.parse(new String[] {"14-25세"});
        assertEquals(14, span.minInclusive());
        assertEquals(25, span.maxInclusive());
        assertEquals(AgeEligibility.Status.ELIGIBLE, AgeEligibility.evaluate(new String[] {"18+"}, 20));
        assertEquals(AgeEligibility.Status.INELIGIBLE, AgeEligibility.evaluate(new String[] {"18 and over"}, 17));
    }

    @Test
    void freeTextWithoutParsableAgeIsUnknown() {
        assertEquals(AgeEligibility.Status.UNKNOWN, AgeEligibility.evaluate(new String[] {"청소년 우대", "신입 가능"}, 16));
        assertEquals(AgeEligibility.Status.UNKNOWN, AgeEligibility.evaluate(new String[] {}, 16));
        assertEquals(AgeEligibility.Status.UNKNOWN, AgeEligibility.evaluate(new String[] {"만 14세 이상"}, null));
        assertNull(AgeEligibility.parse(new String[] {"나이는 문의"}).minInclusive());
        assertEquals(AgeEligibility.Status.UNKNOWN, AgeEligibility.evaluate(new String[] {"나이는 문의"}, 20));
    }
}
