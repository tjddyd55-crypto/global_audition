package com.audition.platform.application.audit;

import com.audition.platform.domain.audit.AdminLog;
import com.audition.platform.domain.audit.AdminLogRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class AdminAuditLogService {

    private final AdminLogRepository adminLogRepository;
    private final ObjectMapper objectMapper;

    public AdminAuditLogService(AdminLogRepository adminLogRepository, ObjectMapper objectMapper) {
        this.adminLogRepository = adminLogRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * payload: {@code { "before": {...}, "after": {...} } }
     */
    @Transactional
    public void log(UUID adminId, String action, String targetType, String targetId, Object before, Object after) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("before", toNestedMap(before));
        payload.put("after", toNestedMap(after));
        AdminLog row = new AdminLog();
        row.setAdminId(adminId);
        row.setAction(action);
        row.setTargetType(targetType);
        row.setTargetId(targetId);
        row.setPayload(payload);
        row.setCreatedAt(Instant.now());
        adminLogRepository.save(row);
    }

    private Map<String, Object> toNestedMap(Object value) {
        if (value == null) {
            return Map.of();
        }
        if (value instanceof Map<?, ?> m) {
            Map<String, Object> out = new LinkedHashMap<>();
            for (Map.Entry<?, ?> e : m.entrySet()) {
                out.put(String.valueOf(e.getKey()), e.getValue());
            }
            return out;
        }
        return objectMapper.convertValue(value, new TypeReference<Map<String, Object>>() {});
    }
}
