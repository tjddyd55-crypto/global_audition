package com.audition.platform.application.channel;

import com.audition.platform.application.user.NationalityCodes;
import com.audition.platform.domain.audition.RecruitFieldCodes;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.Period;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/** 채널 포트폴리오 입력 규칙과 공개용 파생값(연령대·주 분야). */
public final class ChannelPortfolioRules {

    public static final Set<String> LANGUAGE_CODES = Set.of(
            "ko", "en", "mn", "ja", "zh", "es", "fr", "de", "it", "pt", "ru", "th", "vi", "km", "uz");
    public static final int MAX_LANGUAGES = 8;
    public static final int TALENTS_MAX = 500;
    public static final int MAX_CHANNEL_VIDEOS = 50;
    public static final int MAX_CAREERS = 30;

    /** 공개 채널 분야 필터. 모집 분야 코드(RecruitFieldCodes)를 재사용하고 OTHER 는 그 외 전부. */
    public static final List<String> FIELD_FILTERS = List.of("VOCAL", "DANCE", "RAP", "ACTING", "MODEL", "INFLUENCER", "OTHER");
    private static final Set<String> NAMED_FIELDS = Set.of("VOCAL", "DANCE", "RAP", "ACTING", "MODEL", "INFLUENCER");

    public static final int ADULT_AGE = 18;

    private ChannelPortfolioRules() {
    }

    public static String[] languages(List<String> raw) {
        if (raw == null) {
            return null;
        }
        LinkedHashSet<String> out = new LinkedHashSet<>();
        for (String r : raw) {
            if (r == null || r.isBlank()) {
                continue;
            }
            String c = r.trim().toLowerCase(Locale.ROOT);
            if (!LANGUAGE_CODES.contains(c)) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "LANGUAGE_INVALID");
            }
            out.add(c);
        }
        if (out.size() > MAX_LANGUAGES) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "LANGUAGE_TOO_MANY");
        }
        return out.toArray(String[]::new);
    }

    /** null = 변경 없음, 빈 문자열 = 지움. */
    public static String residence(String raw) {
        if (raw == null) {
            return null;
        }
        String c = raw.trim().toUpperCase(Locale.ROOT);
        if (c.isEmpty()) {
            return "";
        }
        if (!NationalityCodes.ALLOWED.contains(c)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "RESIDENCE_INVALID");
        }
        return c;
    }

    public static Integer age(LocalDate birthDate, LocalDate today) {
        if (birthDate == null || today == null || birthDate.isAfter(today)) {
            return null;
        }
        return Period.between(birthDate, today).getYears();
    }

    /** 생년월일이 없으면 미확인(null). 미확인은 성인으로 보지 않는다. */
    public static boolean confirmedAdult(LocalDate birthDate, LocalDate today) {
        Integer a = age(birthDate, today);
        return a != null && a >= ADULT_AGE;
    }

    public static boolean minor(LocalDate birthDate, LocalDate today) {
        Integer a = age(birthDate, today);
        return a != null && a < ADULT_AGE;
    }

    /** 공개 연령대. 생년월일·정확한 나이는 내보내지 않는다. */
    public static String ageBand(LocalDate birthDate, LocalDate today) {
        Integer a = age(birthDate, today);
        if (a == null) {
            return null;
        }
        if (a < 18) {
            return "U18";
        }
        if (a < 20) {
            return "18_19";
        }
        if (a < 25) {
            return "20_24";
        }
        if (a < 30) {
            return "25_29";
        }
        if (a < 35) {
            return "30_34";
        }
        if (a < 40) {
            return "35_39";
        }
        return "40_PLUS";
    }

    public static List<String> fieldCodes(String[] categories) {
        return List.of(RecruitFieldCodes.normalizeAll(categories));
    }

    /** 필터용 분야 코드. 알려진 분야가 아니면 OTHER. */
    public static String filterField(String normalized) {
        return NAMED_FIELDS.contains(normalized) ? normalized : "OTHER";
    }

    public static boolean matchesField(String[] categories, String wanted) {
        if (wanted == null || wanted.isBlank() || "ALL".equalsIgnoreCase(wanted)) {
            return true;
        }
        String w = wanted.trim().toUpperCase(Locale.ROOT);
        for (String code : fieldCodes(categories)) {
            if (filterField(code).equals(w)) {
                return true;
            }
        }
        return false;
    }

    public static String mainField(String[] categories) {
        List<String> codes = fieldCodes(categories);
        return codes.isEmpty() ? null : codes.get(0);
    }
}
