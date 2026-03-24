package com.audition.platform.application;

import com.audition.platform.api.dto.AuditionResponse;
import com.audition.platform.api.dto.CreateAuditionRequest;
import com.audition.platform.api.dto.UpdateAuditionRequest;
import com.audition.platform.application.round.AuditionProcessModes;
import com.audition.platform.application.round.AuditionRoundService;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionTagNormalizer;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.user.UserRepository;
import com.audition.platform.domain.util.YoutubeUrls;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuditionService {

    private final AuditionRepository auditionRepository;
    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;
    private final AuditionRoundService auditionRoundService;

    public AuditionService(AuditionRepository auditionRepository,
                           UserRepository userRepository,
                           ApplicationRepository applicationRepository,
                           AuditionRoundService auditionRoundService) {
        this.auditionRepository = auditionRepository;
        this.userRepository = userRepository;
        this.applicationRepository = applicationRepository;
        this.auditionRoundService = auditionRoundService;
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

    private static String[] listToArray(List<String> list) {
        if (list == null || list.isEmpty()) {
            return new String[0];
        }
        return list.stream().map(String::trim).filter(s -> !s.isEmpty()).toArray(String[]::new);
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

    /**
     * Hibernate/레거시 DB에서 text[] 가 null 로 올 수 있는 경우 엔티티 필드를 빈 배열로 고정 (응답 JSON 배열 null 방지).
     */
    private static void normalizeAuditionArrayFields(Audition a) {
        a.setGalleryImages(a.getGalleryImages());
        a.setRecruitFields(a.getRecruitFields());
        a.setQualifications(a.getQualifications());
        a.setSchedules(a.getSchedules());
        a.setBenefits(a.getBenefits());
        a.setTags(a.getTags());
    }

    private AuditionResponse toResponse(Audition a) {
        normalizeAuditionArrayFields(a);
        AuditionResponse r = new AuditionResponse();
        r.setId(a.getId());
        r.setOwnerId(a.getOwnerId());
        r.setTitle(a.getTitle());
        r.setDescription(a.getDescription());
        r.setStatus(a.getStatus());
        r.setUpdatedAt(a.getUpdatedAt());
        r.setCountryCode(a.getCountryCode());
        r.setDeadlineAt(a.getDeadlineAt());
        r.setTags(a.getTags());
        r.setCreatedAt(a.getCreatedAt());
        r.setCoverImage(a.getCoverImage());
        r.setVideoUrl(a.getVideoUrl());
        r.setGalleryImages(a.getGalleryImages());
        r.setAgencyName(a.getAgencyName() != null ? a.getAgencyName() : "");
        r.setAgencyLogo(a.getAgencyLogo());
        r.setApplicantsCount((int) applicationRepository.countByAuditionId(a.getId()));
        r.setRemainingDays(computeRemainingDays(a.getEndDate()));
        r.setRecruitFields(a.getRecruitFields());
        r.setQualifications(a.getQualifications());
        r.setSchedules(a.getSchedules());
        r.setLocation(a.getLocation() != null ? a.getLocation() : "");
        r.setStartDate(a.getStartDate());
        r.setEndDate(a.getEndDate());
        r.setBenefits(a.getBenefits());
        r.setProcessMode(a.getProcessMode());
        r.setCurrentRoundNumber(a.getCurrentRoundNumber());
        r.setMaxRoundNumber(a.getMaxRoundNumber());
        r.setSelectionStatus(a.getSelectionStatus());
        return r;
    }

    private void applyCreateBody(Audition a, CreateAuditionRequest req) {
        a.setTitle(req.getTitle().trim());
        a.setDescription(req.getDescription().trim());
        a.setStatus(req.getStatus() != null ? req.getStatus() : "DRAFT");
        a.setTags(AuditionTagNormalizer.normalize(req.getTags()));
        a.setCoverImage(req.getCoverImage());
        a.setVideoUrl(req.getVideoUrl());
        a.setGalleryImages(listToArray(req.getGalleryImages() != null ? req.getGalleryImages() : List.of()));
        a.setAgencyName(req.getAgencyName().trim());
        a.setAgencyLogo(req.getAgencyLogo());
        a.setRecruitFields(listToArray(req.getRecruitFields() != null ? req.getRecruitFields() : List.of()));
        a.setQualifications(listToArray(req.getQualifications() != null ? req.getQualifications() : List.of()));
        a.setSchedules(listToArray(req.getSchedules() != null ? req.getSchedules() : List.of()));
        a.setBenefits(listToArray(req.getBenefits() != null ? req.getBenefits() : List.of()));
        a.setLocation(req.getLocation().trim());
        Instant start = parseInstantRequired(req.getStartDate(), "startDate");
        Instant end = parseInstantRequired(req.getEndDate(), "endDate");
        a.setStartDate(start);
        a.setEndDate(end);
        Instant deadlineParsed = parseInstantOrNull(req.getDeadlineAt());
        a.setDeadlineAt(deadlineParsed != null ? deadlineParsed : end);
        a.setCountryCode(req.getCountryCode());
        a.setRemainingDays(computeRemainingDays(end));
        a.setApplicantsCount(0);
        if (req.getProcessMode() != null && AuditionProcessModes.isMultiRound(req.getProcessMode())) {
            a.setProcessMode(AuditionProcessModes.MULTI_ROUND);
        } else {
            a.setProcessMode(AuditionProcessModes.SINGLE);
        }
    }

    private static void assertYoutubeIfVideoPresent(String status, String videoUrl) {
        String st = status != null ? status : "DRAFT";
        if (!"OPEN".equals(st) && !"CLOSED".equals(st)) {
            return;
        }
        if (!YoutubeUrls.isBlankOrValidYoutube(videoUrl)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "영상 링크는 YouTube URL만 입력할 수 있습니다.");
        }
    }

    /** 게시(OPEN)·마감(CLOSED) 시 대표 이미지 URL 필수 */
    private static void assertCoverImageForPublished(String status, String coverImage) {
        String st = status != null ? status : "DRAFT";
        if (!"OPEN".equals(st) && !"CLOSED".equals(st)) {
            return;
        }
        if (coverImage == null || coverImage.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "게시·마감 상태에서는 대표 이미지(coverImage)가 필요합니다.");
        }
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
        assertYoutubeIfVideoPresent(req.getStatus(), req.getVideoUrl());
        assertCoverImageForPublished(req.getStatus(), req.getCoverImage());
        Audition a = new Audition();
        a.setOwnerId(ownerId);
        a.setUpdatedAt(Instant.now());
        applyCreateBody(a, req);
        a = auditionRepository.save(a);
        if (AuditionProcessModes.isMultiRound(a.getProcessMode())) {
            a.setCurrentRoundNumber(1);
            a.setMaxRoundNumber(1);
            a.setSelectionStatus("OPEN".equals(a.getStatus()) ? "OPEN" : "DRAFT");
            a = auditionRepository.save(a);
            auditionRoundService.bootstrapFirstRound(a.getId(), "OPEN".equals(a.getStatus()));
        }
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
        AuditionResponse r = toResponse(a);
        UUID viewerId = SecurityUtils.getCurrentUserId();
        if (viewerId != null && (SecurityUtils.hasRole("APPLICANT") || SecurityUtils.hasRole("ADMIN"))) {
            r.setHasApplied(applicationRepository.existsByAuditionIdAndApplicantId(id, viewerId));
        }
        return r;
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
        if (request.getTags() != null) {
            audition.setTags(AuditionTagNormalizer.normalize(request.getTags()));
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
        if (request.getQualifications() != null) {
            audition.setQualifications(listToArray(request.getQualifications()));
        }
        if (request.getSchedules() != null) {
            audition.setSchedules(listToArray(request.getSchedules()));
        }
        if (request.getBenefits() != null) {
            audition.setBenefits(listToArray(request.getBenefits()));
        }
        if (request.getProcessMode() != null) {
            if (AuditionProcessModes.isMultiRound(request.getProcessMode())) {
                audition.setProcessMode(AuditionProcessModes.MULTI_ROUND);
                if (auditionRoundService.listRounds(id).isEmpty()) {
                    audition.setCurrentRoundNumber(1);
                    audition.setMaxRoundNumber(1);
                    audition.setSelectionStatus("OPEN".equals(audition.getStatus()) ? "OPEN" : "DRAFT");
                    auditionRepository.save(audition);
                    auditionRoundService.bootstrapFirstRound(id, "OPEN".equals(audition.getStatus()));
                }
            } else {
                audition.setProcessMode(AuditionProcessModes.SINGLE);
            }
        }

        assertYoutubeIfVideoPresent(audition.getStatus(), audition.getVideoUrl());
        assertCoverImageForPublished(audition.getStatus(), audition.getCoverImage());

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
