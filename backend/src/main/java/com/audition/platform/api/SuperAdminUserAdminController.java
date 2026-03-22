package com.audition.platform.api;

import com.audition.platform.api.dto.AdminUserPatchRequest;
import com.audition.platform.api.dto.AdminUserSummaryDto;
import com.audition.platform.application.user.SuperAdminUserAdministrationService;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/users")
public class SuperAdminUserAdminController {

    private final SuperAdminUserAdministrationService superAdminUserAdministrationService;

    public SuperAdminUserAdminController(SuperAdminUserAdministrationService superAdminUserAdministrationService) {
        this.superAdminUserAdministrationService = superAdminUserAdministrationService;
    }

    @PatchMapping("/{userId}")
    public AdminUserSummaryDto patchUser(@PathVariable UUID userId, @RequestBody AdminUserPatchRequest request) {
        return superAdminUserAdministrationService.patchUser(userId, request);
    }
}
