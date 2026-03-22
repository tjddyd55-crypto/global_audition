package com.audition.platform.application.audit;

import com.audition.platform.api.dto.AdminLogEntryDto;
import com.audition.platform.application.credit.SuperAdminAuthHelper;
import com.audition.platform.domain.audit.AdminLog;
import com.audition.platform.domain.audit.AdminLogRepository;
import com.audition.platform.domain.audit.AdminLogSpecifications;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class SuperAdminAdminLogQueryService {

    private final AdminLogRepository adminLogRepository;

    public SuperAdminAdminLogQueryService(AdminLogRepository adminLogRepository) {
        this.adminLogRepository = adminLogRepository;
    }

    @Transactional(readOnly = true)
    public Page<AdminLogEntryDto> list(UUID adminIdFilter, String action, Instant from, Instant to, Pageable pageable) {
        SuperAdminAuthHelper.requireSuperAdmin();
        return adminLogRepository
                .findAll(AdminLogSpecifications.filter(adminIdFilter, action, from, to), pageable)
                .map(SuperAdminAdminLogQueryService::toDto);
    }

    private static AdminLogEntryDto toDto(AdminLog row) {
        AdminLogEntryDto d = new AdminLogEntryDto();
        d.setId(row.getId().toString());
        d.setAdminId(row.getAdminId().toString());
        d.setAction(row.getAction());
        d.setTargetType(row.getTargetType());
        d.setTargetId(row.getTargetId());
        d.setPayload(row.getPayload());
        d.setCreatedAt(row.getCreatedAt());
        return d;
    }
}
