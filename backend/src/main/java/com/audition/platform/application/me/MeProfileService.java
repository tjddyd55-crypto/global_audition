package com.audition.platform.application.me;

import com.audition.platform.api.dto.me.MeProfileResponse;
import com.audition.platform.api.dto.me.MeUserSnsLinkDto;
import com.audition.platform.api.dto.me.PatchMePasswordRequest;
import com.audition.platform.api.dto.me.PatchMeProfileRequest;
import com.audition.platform.application.user.UserNicknameService;
import com.audition.platform.application.user.UserSnsLinkReplacementService;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import com.audition.platform.domain.user.UserSnsLink;
import com.audition.platform.domain.user.UserSnsLinkRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MeProfileService {

    private static final Set<String> ALLOWED_NATIONALITIES = Set.of("KR", "MN", "JP", "OTHER");

    private final UserRepository userRepository;
    private final UserNicknameService userNicknameService;
    private final UserSnsLinkRepository userSnsLinkRepository;
    private final UserSnsLinkReplacementService userSnsLinkReplacementService;
    private final PasswordEncoder passwordEncoder;

    public MeProfileService(
            UserRepository userRepository,
            UserNicknameService userNicknameService,
            UserSnsLinkRepository userSnsLinkRepository,
            UserSnsLinkReplacementService userSnsLinkReplacementService,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.userNicknameService = userNicknameService;
        this.userSnsLinkRepository = userSnsLinkRepository;
        this.userSnsLinkReplacementService = userSnsLinkReplacementService;
        this.passwordEncoder = passwordEncoder;
    }

    private UUID requireUserId() {
        UUID id = SecurityUtils.getCurrentUserId();
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        return id;
    }

    public MeProfileResponse getProfile() {
        UUID userId = requireUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "사용자를 찾을 수 없습니다."));
        return toResponse(user);
    }

    @Transactional
    public MeProfileResponse patchProfile(PatchMeProfileRequest req) {
        UUID userId = requireUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "사용자를 찾을 수 없습니다."));
        if (req.getNickname() != null && !req.getNickname().isBlank()) {
            String next = userNicknameService.prepareNicknameOrThrow(req.getNickname(), userId);
            user.setNickname(next);
        }
        if (req.getName() != null) {
            user.setName(req.getName().trim().isEmpty() ? null : req.getName().trim());
        }
        if (req.getProfileImageUrl() != null) {
            user.setProfileImageUrl(req.getProfileImageUrl().trim().isEmpty() ? null : req.getProfileImageUrl().trim());
        }
        if (req.getBio() != null) {
            user.setBio(req.getBio().trim().isEmpty() ? null : req.getBio().trim());
        }
        if (req.getBirthDate() != null) {
            String raw = req.getBirthDate().trim();
            if (raw.isEmpty()) {
                user.setBirthDate(null);
            } else {
                try {
                    user.setBirthDate(LocalDate.parse(raw));
                } catch (DateTimeParseException e) {
                    throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "생년월일 형식이 올바르지 않습니다.");
                }
            }
        }
        if (req.getNationality() != null) {
            String n = req.getNationality().trim().toUpperCase(Locale.ROOT);
            if (n.isEmpty()) {
                user.setNationality(null);
            } else {
                if (!ALLOWED_NATIONALITIES.contains(n)) {
                    throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "국적 값이 올바르지 않습니다.");
                }
                user.setNationality(n);
            }
        }
        if (req.getIntroText() != null) {
            user.setIntroText(req.getIntroText().trim().isEmpty() ? null : req.getIntroText().trim());
        }

        if (req.getSnsLinks() != null) {
            userSnsLinkReplacementService.replaceAll(userId, req.getSnsLinks());
        }

        user.setUpdatedAt(Instant.now());
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public void changePassword(PatchMePasswordRequest req) {
        UUID userId = requireUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "사용자를 찾을 수 없습니다."));
        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "현재 비밀번호가 일치하지 않습니다.");
        }
        if (req.getCurrentPassword().equals(req.getNewPassword())) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "새 비밀번호는 현재 비밀번호와 달라야 합니다.");
        }
        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
    }

    private MeProfileResponse toResponse(User user) {
        MeProfileResponse r = new MeProfileResponse();
        r.setId(user.getId().toString());
        r.setEmail(user.getEmail());
        r.setUsername(user.getUsername());
        r.setNickname(user.getNickname());
        r.setName(user.getName());
        r.setDisplayName(user.getPublicDisplayLabel());
        r.setRole(MeApiMapping.userRoleToApi(user.getRole()));
        r.setProfileImageUrl(user.getProfileImageUrl());
        r.setBio(user.getBio());
        r.setBirthDate(user.getBirthDate() != null ? user.getBirthDate().toString() : null);
        r.setNationality(user.getNationality());
        r.setIntroText(user.getIntroText());
        List<UserSnsLink> links = userSnsLinkRepository.findByUserIdOrderByCreatedAtAsc(user.getId());
        r.setSnsLinks(links.stream().map(l -> {
            MeUserSnsLinkDto d = new MeUserSnsLinkDto();
            d.setPlatform(l.getPlatform());
            d.setUrl(l.getUrl());
            return d;
        }).collect(Collectors.toList()));
        return r;
    }
}
