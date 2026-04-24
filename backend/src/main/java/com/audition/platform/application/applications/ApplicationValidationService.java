package com.audition.platform.application.applications;

import com.audition.platform.api.dto.CreateApplicationRequest;
import com.audition.platform.domain.util.ApplicationBirthdates;
import com.audition.platform.domain.util.SocialVideoUrls;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * 지원서 입력값 검증/정규화 유스케이스.
 *
 * <p>3차 리팩토링에서는 기존 submit 흐름을 건드리지 않고, 검증 로직 이동을 위한
 * 독립 서비스를 먼저 만든다. 다음 단계에서 {@link ApplicationSubmitService}가 이 서비스를 사용한다.</p>
 */
@Service
public class ApplicationValidationService {

    private static final Set<String> ALLOWED_NATIONALITIES = Set.of("KR", "MN", "JP", "OTHER");

    private static final Set<String> ALLOWED_SNS_PLATFORMS = Set.of(
            "instagram", "tiktok", "youtube", "twitter", "facebook", "other");

    public ValidatedBirthDate validateBirthDate(String rawBirthDate, Integer requestedAge) {
        String birthRaw = rawBirthDate != null ? rawBirthDate.trim() : "";
        if (birthRaw.isEmpty()) {
            if (requestedAge != null) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "생년월일이 없으면 나이를 보낼 수 없습니다.");
            }
            return new ValidatedBirthDate(null, null);
        }

        LocalDate birthDate;
        try {
            birthDate = LocalDate.parse(birthRaw);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "생년월일 형식이 올바르지 않습니다.");
        }

        Integer computedAge;
        try {
            computedAge = ApplicationBirthdates.ageOnDate(birthDate, LocalDate.now(ZoneId.of("Asia/Seoul")));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "생년월일이 올바르지 않습니다.");
        }

        if (requestedAge != null && !requestedAge.equals(computedAge)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "생년월일과 나이가 일치하지 않습니다.");
        }
        return new ValidatedBirthDate(birthDate, computedAge);
    }

    public String normalizeNationality(String rawNationality) {
        if (rawNationality == null || rawNationality.isBlank()) {
            return null;
        }
        String nationality = rawNationality.trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_NATIONALITIES.contains(nationality)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "국적 값이 올바르지 않습니다.");
        }
        return nationality;
    }

    public String validateAuditionVideoUrl(String rawVideoUrl) {
        String videoUrl = rawVideoUrl != null ? rawVideoUrl.trim() : "";
        if (!SocialVideoUrls.isValidAuditionVideoUrl(videoUrl)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "영상 링크는 YouTube, TikTok, Instagram 영상 주소만 입력할 수 있습니다.");
        }
        return videoUrl;
    }

    public List<NormalizedSnsLink> normalizeSnsPayload(List<CreateApplicationRequest.SnsLinkItem> raw) {
        List<NormalizedSnsLink> out = new ArrayList<>();
        for (CreateApplicationRequest.SnsLinkItem item : raw != null ? raw : List.<CreateApplicationRequest.SnsLinkItem>of()) {
            if (item == null) {
                continue;
            }
            String platform = item.getPlatform() != null ? item.getPlatform().trim().toLowerCase(Locale.ROOT) : "";
            String url = item.getUrl() != null ? item.getUrl().trim() : "";
            if (platform.isEmpty() && url.isEmpty()) {
                continue;
            }
            if (platform.isEmpty() || url.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "SNS는 플랫폼과 URL을 함께 입력해 주세요.");
            }
            if (!ALLOWED_SNS_PLATFORMS.contains(platform)) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "지원하지 않는 SNS 플랫폼입니다.");
            }
            assertHttpUrl(url);
            out.add(new NormalizedSnsLink(platform, url));
        }
        return out;
    }

    private static void assertHttpUrl(String url) {
        try {
            URI uri = URI.create(url);
            String scheme = uri.getScheme();
            if (!("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme))) {
                throw new IllegalArgumentException("invalid scheme");
            }
            if (uri.getHost() == null || uri.getHost().isBlank()) {
                throw new IllegalArgumentException("missing host");
            }
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "SNS URL 형식이 올바르지 않습니다.");
        }
    }

    public record ValidatedBirthDate(LocalDate birthDate, Integer age) {
    }

    public record NormalizedSnsLink(String platform, String url) {
    }
}
