package com.audition.platform.application;

import com.audition.platform.api.dto.AuditionResponse;
import com.audition.platform.api.dto.CreateAuditionRequest;
import com.audition.platform.api.dto.UpdateAuditionRequest;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.user.UserRepository;
import com.audition.platform.infra.SecurityUtils;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuditionService {

    private static final String[] DETAIL_KEYS = {"recruit", "qualification", "schedule", "benefits"};

    private final AuditionRepository auditionRepository;
    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;
    private final ObjectMapper objectMapper;

    public AuditionService(AuditionRepository auditionRepository,
                           UserRepository userRepository,
                           ApplicationRepository applicationRepository,
                           ObjectMapper objectMapper) {
        this.auditionRepository = auditionRepository;
        this.userRepository = userRepository;
        this.applicationRepository = applicationRepository;
        this.objectMapper = objectMapper;
    }

    private static Instant parseInstantRequired(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, field + " is required (ISO-8601)");
        }
        try {
            return Instant.parse(value);
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, field + " must be ISO-8601 datetime");
        }
    }

    private static Instant parseInstantOrNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Instant.parse(value);
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "deadlineAt must be ISO-8601 datetime");
        }
    }

    private JsonNode normalizeDetailContent(JsonNode raw) {
        ObjectNode out = objectMapper.createObjectNode();
        for (String key : DETAIL_KEYS) {
            if (raw != null && raw.isObject() && raw.has(key) && raw.get(key).isArray()) {
                out.set(key, raw.get(key));
            } else {
                out.set(key, objectMapper.createArrayNode());
            }
        }
        return out;
    }

    private static String[] listToArray(List<String> list) {
        if (list == null || list.isEmpty()) {
            return new String[0];
        }
        return list.stream().map(String::trim).filter(s -> !s.isEmpty()).toArray(String[]::new);
    }

    private static String[] jsonArrayToStrings(JsonNode arr) {
        if (arr == null || !arr.isArray()) {
            return new String[0];
        }
        List<String> list = new ArrayList<>();
        for (JsonNode n : arr) {
            if (n != null && n.isTextual()) {
                String t = n.asText().trim();
                if (!t.isEmpty()) {
                    list.add(t);
                }
            }
        }
        return list.toArray(new String[0]);
    }

    private static void putArray(ObjectNode parent, String key, String[] values) {
        ArrayNode arr = parent.arrayNode();
        for (String v : values) {
            arr.add(v);
        }
        parent.set(key, arr);
    }

    private int computeRemainingDays(Instant endDate) {
        if (endDate == null) {
            return 0;
        }
        LocalDate end = endDate.atZone(ZoneOffset.UTC).toLocalDate();
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        long days = ChronoUnit.DAYS.between(today, end);
        return (int) Math.max(0, days);
    }

    private AuditionResponse toResponse(Audition a) {
        AuditionResponse r = new AuditionResponse();
        r.setId(a.getId());
        r.setOwnerId(a.getOwnerId());
        r.setTitle(a.getTitle());
        r.setDescription(a.getDescription());
        r.setStatus(a.getStatus());
        r.setUpdatedAt(a.getUpdatedAt());
        r.setCountryCode(a.getCountryCode());
        r.setDeadlineAt(a.getDeadlineAt());
        r.setCategory(a.getCategory());
        r.setCreatedAt(a.getCreatedAt());
        r.setCoverImage(a.getCoverImage());
        r.setVideoUrl(a.getVideoUrl());
        r.setGalleryImages(a.getGalleryImages() != null ? a.getGalleryImages() : new String[0]);
        r.setAgencyName(a.getAgencyName() != null ? a.getAgencyName() : "");
        r.setAgencyLogo(a.getAgencyLogo());
        r.setApplicantsCount((int) applicationRepository.countByAuditionId(a.getId()));
        r.setRemainingDays(computeRemainingDays(a.getEndDate()));
        r.setRecruitFields(a.getRecruitFields() != null ? a.getRecruitFields() : new String[0]);
        r.setLocation(a.getLocation() != null ? a.getLocation() : "");
        r.setStartDate(a.getStartDate());
        r.setEndDate(a.getEndDate());
        r.setDetailContent(a.getDetailContent() != null ? a.getDetailContent() : normalizeDetailContent(null));
        r.setBenefits(a.getBenefits() != null ? a.getBenefits() : new String[0]);
        return r;
    }

    private void applyCreateBody(Audition a, CreateAuditionRequest req) {
        JsonNode detail = normalizeDetailContent(req.getDetailContent());
        ObjectNode merged = (ObjectNode) detail;

        String[] recruits = listToArray(req.getRecruitFields());
        if (recruits.length == 0) {
            recruits = jsonArrayToStrings(merged.get("recruit"));
        }
        String[] quals = jsonArrayToStrings(merged.get("qualification"));
        String[] sched = jsonArrayToStrings(merged.get("schedule"));
        String[] benFromDetail = jsonArrayToStrings(merged.get("benefits"));
        String[] ben = listToArray(req.getBenefits());
        if (ben.length == 0) {
            ben = benFromDetail;
        }

        putArray(merged, "recruit", recruits);
        putArray(merged, "qualification", quals);
        putArray(merged, "schedule", sched);
        putArray(merged, "benefits", ben);

        a.setTitle(req.getTitle().trim());
        a.setDescription(req.getDescription().trim());
        a.setStatus(req.getStatus() != null ? req.getStatus() : "DRAFT");
        a.setCategory(req.getCategory().trim());
        a.setCoverImage(req.getCoverImage());
        a.setVideoUrl(req.getVideoUrl());
        a.setGalleryImages(listToArray(req.getGalleryImages()));
        a.setAgencyName(req.getAgencyName().trim());
        a.setAgencyLogo(req.getAgencyLogo());
        a.setRecruitFields(recruits);
        a.setLocation(req.getLocation().trim());
        Instant start = parseInstantRequired(req.getStartDate(), "startDate");
        Instant end = parseInstantRequired(req.getEndDate(), "endDate");
        a.setStartDate(start);
        a.setEndDate(end);
        a.setDeadlineAt(parseInstantOrNull(req.getDeadlineAt()) != null ? parseInstantOrNull(req.getDeadlineAt()) : end);
        a.setCountryCode(req.getCountryCode());
        a.setDetailContent(merged);
        a.setBenefits(ben);
        a.setRemainingDays(computeRemainingDays(end));
        a.setApplicantsCount(0);
    }

    @Transactional
    public AuditionResponse create(CreateAuditionRequest req) {
        UUID ownerId = SecurityUtils.getCurrentUserId();
        if (ownerId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        if (!SecurityUtils.hasRole("AGENCY") && !SecurityUtils.hasRole("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only AGENCY or ADMIN can create auditions");
        }
        if (!userRepository.existsById(ownerId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User not found");
        }
        Audition a = new Audition();
        a.setOwnerId(ownerId);
        a.setUpdatedAt(Instant.now());
        applyCreateBody(a, req);
        a = auditionRepository.save(a);
        return toResponse(a);
    }

    public List<AuditionResponse> listOpen() {
        return auditionRepository.findByStatusOrderByCreatedAtDesc("OPEN").stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<AuditionResponse> listByStatus(String status) {
        return auditionRepository.findByStatusOrderByCreatedAtDesc(status).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<AuditionResponse> listAll() {
        return auditionRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<AuditionResponse> listMine() {
        UUID ownerId = SecurityUtils.getCurrentUserId();
        if (ownerId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        if (!SecurityUtils.hasRole("AGENCY") && !SecurityUtils.hasRole("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only AGENCY or ADMIN can list own auditions");
        }
        return auditionRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public AuditionResponse getById(UUID id) {
        Audition a = auditionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Audition not found"));
        return toResponse(a);
    }

    @Transactional
    public AuditionResponse update(UUID id, UpdateAuditionRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        Audition audition = auditionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Audition not found"));
        if (!SecurityUtils.hasRole("ADMIN") && !audition.getOwnerId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only owner or ADMIN can update this audition");
        }

        if (request.getTitle() != null) {
            audition.setTitle(request.getTitle().trim());
        }
        if (request.getDescription() != null) {
            audition.setDescription(request.getDescription().trim());
        }
        if (request.getStatus() != null) {
            audition.setStatus(request.getStatus());
        }
        if (request.getCountryCode() != null) {
            audition.setCountryCode(request.getCountryCode());
        }
        if (request.getCategory() != null) {
            audition.setCategory(request.getCategory().trim());
        }
        if (request.getDeadlineAt() != null) {
            audition.setDeadlineAt(parseInstantOrNull(request.getDeadlineAt()));
        }
        if (request.getCoverImage() != null) {
            audition.setCoverImage(request.getCoverImage());
        }
        if (request.getVideoUrl() != null) {
            audition.setVideoUrl(request.getVideoUrl());
        }
        if (request.getGalleryImages() != null) {
            audition.setGalleryImages(listToArray(request.getGalleryImages()));
        }
        if (request.getAgencyName() != null) {
            audition.setAgencyName(request.getAgencyName().trim());
        }
        if (request.getAgencyLogo() != null) {
            audition.setAgencyLogo(request.getAgencyLogo());
        }
        if (request.getLocation() != null) {
            audition.setLocation(request.getLocation().trim());
        }
        if (request.getStartDate() != null) {
            audition.setStartDate(parseInstantRequired(request.getStartDate(), "startDate"));
        }
        if (request.getEndDate() != null) {
            audition.setEndDate(parseInstantRequired(request.getEndDate(), "endDate"));
        }
        if (request.getRecruitFields() != null) {
            audition.setRecruitFields(listToArray(request.getRecruitFields()));
        }
        if (request.getBenefits() != null) {
            audition.setBenefits(listToArray(request.getBenefits()));
        }
        if (request.getDetailContent() != null) {
            JsonNode detail = normalizeDetailContent(request.getDetailContent());
            ObjectNode merged = (ObjectNode) detail;
            if (request.getRecruitFields() != null) {
                putArray(merged, "recruit", audition.getRecruitFields());
            }
            if (request.getBenefits() != null) {
                putArray(merged, "benefits", audition.getBenefits());
            }
            audition.setDetailContent(merged);
        } else if (request.getRecruitFields() != null || request.getBenefits() != null) {
            ObjectNode merged = (ObjectNode) normalizeDetailContent(audition.getDetailContent());
            if (request.getRecruitFields() != null) {
                putArray(merged, "recruit", audition.getRecruitFields());
            }
            if (request.getBenefits() != null) {
                putArray(merged, "benefits", audition.getBenefits());
            }
            audition.setDetailContent(merged);
        }

        if (audition.getEndDate() != null) {
            audition.setRemainingDays(computeRemainingDays(audition.getEndDate()));
        }
        audition.setUpdatedAt(Instant.now());
        return toResponse(auditionRepository.save(audition));
    }

    public void delete(UUID id) {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        Audition audition = auditionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Audition not found"));
        if (!SecurityUtils.hasRole("ADMIN") && !audition.getOwnerId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only owner or ADMIN can delete this audition");
        }
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Audition delete is not supported yet");
    }
}
