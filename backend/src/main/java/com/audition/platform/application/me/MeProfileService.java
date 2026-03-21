package com.audition.platform.application.me;

import com.audition.platform.api.dto.me.MeProfileResponse;
import com.audition.platform.api.dto.me.PatchMeProfileRequest;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.UUID;

@Service
public class MeProfileService {

    private final UserRepository userRepository;

    public MeProfileService(UserRepository userRepository) {
        this.userRepository = userRepository;
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
        if (req.getDisplayName() != null && !req.getDisplayName().isBlank()) {
            user.setDisplayName(req.getDisplayName().trim());
        }
        if (req.getProfileImageUrl() != null) {
            user.setProfileImageUrl(req.getProfileImageUrl().trim().isEmpty() ? null : req.getProfileImageUrl().trim());
        }
        if (req.getBio() != null) {
            user.setBio(req.getBio().trim().isEmpty() ? null : req.getBio().trim());
        }
        user.setUpdatedAt(Instant.now());
        return toResponse(userRepository.save(user));
    }

    private static MeProfileResponse toResponse(User user) {
        MeProfileResponse r = new MeProfileResponse();
        r.setId(user.getId().toString());
        r.setEmail(user.getEmail());
        r.setUsername(user.getUsername());
        r.setDisplayName(user.getDisplayName());
        r.setRole(MeApiMapping.userRoleToApi(user.getRole()));
        r.setProfileImageUrl(user.getProfileImageUrl());
        r.setBio(user.getBio());
        return r;
    }
}
