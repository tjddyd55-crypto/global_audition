package com.audition.platform.application.user;

import java.util.Set;

/**
 * 지원자 국적 코드. 지원서·프로필·채널이 같은 집합을 쓴다.
 * KH(캄보디아)·UZ(우즈베키스탄)는 국가 코드이며 언어 코드 km·uz 와 다르다.
 */
public final class NationalityCodes {

    public static final Set<String> ALLOWED = Set.of("KR", "MN", "JP", "KH", "UZ", "OTHER");

    private NationalityCodes() {
    }
}
