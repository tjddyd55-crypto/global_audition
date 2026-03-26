package com.audition.platform.application.user;

import com.audition.platform.api.dto.AdminUserPatchRequest;
import com.audition.platform.api.dto.AdminUserSummaryDto;
import com.audition.platform.application.audit.AdminAuditAction;
import com.audition.platform.application.audit.AdminAuditLogService;
import com.audition.platform.application.credit.SuperAdminAuthHelper;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class SuperAdminUserAdministrationService {

    private final UserRepository userRepository;
    private final AdminAuditLogService adminAuditLogService;
    private final UserNicknameService userNicknameService;

    public SuperAdminUserAdministrationService(
            UserRepository userRepository,
            AdminAuditLogService adminAuditLogService,
            UserNicknameService userNicknameService) {
        this.userRepository = userRepository;
        this.adminAuditLogService = adminAuditLogService;
        this.userNicknameService = userNicknameService;
    }

    @Transactional
    public AdminUserSummaryDto patchUser(UUID userId, AdminUserPatchRequest req) {
        SuperAdminAuthHelper.requireSuperAdmin();
        UUID adminId = SecurityUtils.getCurrentUserId();
        if (adminId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        boolean any =
                req.getNickname() != null
                        || req.getName() != null
                        || req.getBio() != null
                        || req.getProfileImageUrl() != null
                        || req.getCountryCode() != null;
        if (!any) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "수정할 필드가 하나 이상 필요합니다.");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
        Map<String, Object> before = userSnapshot(user);
        if (req.getNickname() != null && !req.getNickname().isBlank()) {
            String next = userNicknameService.prepareNicknameOrThrow(req.getNickname(), userId);
            user.setNickname(next);
        }
        if (req.getName() != null) {
            user.setName(req.getName().trim().isEmpty() ? null : req.getName().trim());
        }
        if (req.getBio() != null) {
            user.setBio(req.getBio().trim().isEmpty() ? null : req.getBio().trim());
        }
        if (req.getProfileImageUrl() != null) {
            user.setProfileImageUrl(
                    req.getProfileImageUrl().trim().isEmpty() ? null : req.getProfileImageUrl().trim());
        }
        if (req.getCountryCode() != null) {
            user.setCountryCode(req.getCountryCode().trim().isEmpty() ? null : req.getCountryCode().trim());
        }
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
        Map<String, Object> after = userSnapshot(user);
        adminAuditLogService.log(adminId, AdminAuditAction.USER_UPDATE, "USER", userId.toString(), before, after);
        return toSummary(user);
    }

    private static Map<String, Object> userSnapshot(User u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", u.getId().toString());
        m.put("email", u.getEmail());
        m.put("username", u.getUsername());
        m.put("nickname", u.getNickname());
        m.put("name", u.getName());
        m.put("displayName", u.getPublicDisplayLabel());
        m.put("bio", u.getBio());
        m.put("profileImageUrl", u.getProfileImageUrl());
        m.put("countryCode", u.getCountryCode());
        m.put("role", u.getRole());
        return m;
    }

    private static AdminUserSummaryDto toSummary(User u) {
        AdminUserSummaryDto d = new AdminUserSummaryDto();
        d.setId(u.getId().toString());
        d.setEmail(u.getEmail());
        d.setUsername(u.getUsername());
        d.setNickname(u.getNickname());
        d.setName(u.getName());
        d.setDisplayName(u.getPublicDisplayLabel());
        d.setBio(u.getBio());
        d.setProfileImageUrl(u.getProfileImageUrl());
        d.setCountryCode(u.getCountryCode());
        d.setRole(u.getRole());
        return d;
    }
}
