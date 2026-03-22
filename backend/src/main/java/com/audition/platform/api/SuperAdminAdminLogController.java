package com.audition.platform.api;

import com.audition.platform.api.dto.AdminLogEntryDto;
import com.audition.platform.application.audit.SuperAdminAdminLogQueryService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/logs")
public class SuperAdminAdminLogController {

    private final SuperAdminAdminLogQueryService superAdminAdminLogQueryService;

    public SuperAdminAdminLogController(SuperAdminAdminLogQueryService superAdminAdminLogQueryService) {
        this.superAdminAdminLogQueryService = superAdminAdminLogQueryService;
    }

    @GetMapping
    public Page<AdminLogEntryDto> list(
            @RequestParam(required = false) UUID adminId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return superAdminAdminLogQueryService.list(adminId, action, from, to, pageable);
    }
}
