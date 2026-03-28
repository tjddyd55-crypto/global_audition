package com.audition.platform.application.user;

import com.audition.platform.api.dto.me.MeUserSnsLinkDto;
import com.audition.platform.domain.user.UserSnsLink;
import com.audition.platform.domain.user.UserSnsLinkRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class UserSnsLinkReplacementService {

    private static final Set<String> ALLOWED_SNS_PLATFORMS = Set.of(
            "instagram", "tiktok", "youtube", "twitter", "facebook", "other");

    private final UserSnsLinkRepository userSnsLinkRepository;

    public UserSnsLinkReplacementService(UserSnsLinkRepository userSnsLinkRepository) {
        this.userSnsLinkRepository = userSnsLinkRepository;
    }

    @Transactional
    public void replaceAll(UUID userId, List<MeUserSnsLinkDto> raw) {
        List<MeUserSnsLinkDto> normalized = normalizeSnsRows(raw);
        userSnsLinkRepository.deleteByUserId(userId);
        userSnsLinkRepository.flush();
        for (MeUserSnsLinkDto row : normalized) {
            UserSnsLink link = new UserSnsLink();
            link.setUserId(userId);
            link.setPlatform(row.getPlatform().trim().toLowerCase(Locale.ROOT));
            link.setUrl(row.getUrl().trim());
            userSnsLinkRepository.save(link);
        }
    }

    public static List<MeUserSnsLinkDto> normalizeSnsRows(List<MeUserSnsLinkDto> raw) {
        if (raw == null || raw.isEmpty()) {
            return List.of();
        }
        List<MeUserSnsLinkDto> out = new ArrayList<>();
        for (MeUserSnsLinkDto item : raw) {
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
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                        "지원하지 않는 SNS 플랫폼입니다. 허용 값: YOUTUBE, INSTAGRAM, TIKTOK, TWITTER, FACEBOOK, OTHER");
            }
            assertHttpUrl(url);
            MeUserSnsLinkDto dto = new MeUserSnsLinkDto();
            dto.setPlatform(platform);
            dto.setUrl(url);
            out.add(dto);
        }
        return out;
    }

    private static void assertHttpUrl(String url) {
        try {
            URI u = URI.create(url);
            String scheme = u.getScheme();
            if (scheme == null || !(scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"))) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "SNS URL은 http(s) 주소여야 합니다.");
            }
            if (u.getHost() == null || u.getHost().isBlank()) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "SNS URL이 올바르지 않습니다.");
            }
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "SNS URL이 올바르지 않습니다.");
        }
    }
}
