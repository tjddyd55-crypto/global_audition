package com.audition.platform.application;

import com.audition.platform.api.dto.AuditionImagesDto;
import com.audition.platform.api.dto.AuditionResponse;
import com.audition.platform.api.dto.AuditionRoundSummaryDto;
import com.audition.platform.api.dto.CreateAuditionRequest;
import com.audition.platform.api.dto.UpdateAuditionRequest;
import com.audition.platform.application.audition.AuditionSeriesEligibilityService;
import com.audition.platform.application.audition.AuditionSeriesPresentation;
import com.audition.platform.api.dto.AuditionTagRefDto;
import com.audition.platform.application.round.AuditionProcessModes;
import com.audition.platform.application.round.AuditionRoundService;
import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.application.tag.AuditionTagService;
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
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuditionService {

    private final AuditionRepository auditionRepository;
    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;
    private final AuditionRoundService auditionRoundService;
    private final AuditionTagService auditionTagService;
    private final AuditionSeriesEligibilityService auditionSeriesEligibilityService;

    public AuditionService(AuditionRepository auditionRepository,
                           UserRepository userRepository,
                           ApplicationRepository applicationRepository,
                           AuditionRoundService auditionRoundService,
                           AuditionTagService auditionTagService,
                           AuditionSeriesEligibilityService auditionSeriesEligibilityService) {
        this.auditionRepository = auditionRepository;
        this.userRepository = userRepository;
        this.applicationRepository = applicationRepository;
        this.auditionRoundService = auditionRoundService;
        this.auditionTagService = auditionTagService;
        this.auditionSeriesEligibilityService = auditionSeriesEligibilityService;
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
    }

    private static String trimOrNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private static String originalFromDto(AuditionImagesDto img) {
        if (img == null) {
            return null;
        }
        return trimOrNull(img.getOriginal());
    }

    private void applyImagesToEntity(Audition a, AuditionImagesDto img) {
        if (img == null) {
            a.setImageOriginalUrl(null);
            a.setImageMediumUrl(null);
            a.setImageThumbUrl(null);
            a.setCoverImage(null);
            return;
        }
        String o = trimOrNull(img.getOriginal());
        String m = trimOrNull(img.getMedium());
        String t = trimOrNull(img.getThumb());
        a.setImageOriginalUrl(o);
        a.setImageMediumUrl(m != null ? m : o);
        a.setImageThumbUrl(t != null ? t : o);
        a.setCoverImage(o);
    }

    private AuditionImagesDto buildImagesForResponse(Audition a) {
        String o = a.getImageOriginalUrl();
        String m = a.getImageMediumUrl();
        String t = a.getImageThumbUrl();
        String legacy = a.getCoverImage();
        if ((o == null || o.isBlank()) && legacy != null && !legacy.isBlank()) {
            o = legacy;
            m = legacy;
            t = legacy;
        }
        if ((m == null || m.isBlank()) && o != null && !o.isBlank()) {
            m = o;
        }
        if ((t == null || t.isBlank()) && o != null && !o.isBlank()) {
            t = o;
        }
        AuditionImagesDto dto = new AuditionImagesDto();
        dto.setOriginal(o);
        dto.setMedium(m);
        dto.setThumb(t);
        return dto;
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
        r.setTags(auditionTagService.resolveMergedDisplayNames(a.getId()).toArray(new String[0]));
        r.setTagRefs(auditionTagService.listRefs(a.getId()));
        r.setCreatedAt(a.getCreatedAt());
        r.setImages(buildImagesForResponse(a));
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
        r.setGroupId(a.getGroupId());
        r.setSeriesRound(a.getSeriesRound());
        r.setDisplayTitle(AuditionSeriesPresentation.displayTitle(a.getTitle(), a.getSeriesRound()));
        r.setRecruitmentRoundLabel(
                AuditionSeriesPresentation.recruitmentRoundLabel(a.getStatus(), a.getSeriesRound()));
        return r;
    }

    private void applyAuditionTagsInput(UUID auditionId, CreateAuditionRequest req) {
        if (req.getTagIds() != null || req.getCustomTagNames() != null) {
            auditionTagService.replaceAuditionTags(
                    auditionId,
                    req.getTagIds() != null ? req.getTagIds() : List.of(),
                    req.getCustomTagNames() != null ? req.getCustomTagNames() : List.of());
        } else {
            auditionTagService.replaceFromLegacyList(auditionId, req.getTags() != null ? req.getTags() : List.of());
        }
    }

    private void applyCreateBody(Audition a, CreateAuditionRequest req) {
        a.setTitle(req.getTitle().trim());
        a.setDescription(req.getDescription().trim());
        a.setStatus(req.getStatus() != null ? req.getStatus() : "DRAFT");
        applyImagesToEntity(a, req.getImages());
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

    /** 게시(OPEN)·마감(CLOSED) 시 대표 이미지 원본 URL 필수 */
    private static void assertCoverImageForPublished(String status, String imageOriginalUrl) {
        String st = status != null ? status : "DRAFT";
        if (!"OPEN".equals(st) && !"CLOSED".equals(st)) {
            return;
        }
        if (imageOriginalUrl == null || imageOriginalUrl.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "게시·마감 상태에서는 대표 이미지(images.original)가 필요합니다.");
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
        assertCoverImageForPublished(req.getStatus(), originalFromDto(req.getImages()));
        UUID newId = UUID.randomUUID();
        Audition a = new Audition();
        a.setId(newId);
        a.setGroupId(newId);
        a.setSeriesRound(1);
        a.setOwnerId(ownerId);
        a.setUpdatedAt(Instant.now());
        applyCreateBody(a, req);
        a = auditionRepository.save(a);
        applyAuditionTagsInput(a.getId(), req);
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
            Optional<Application> myApp = applicationRepository.findByAuditionIdAndApplicantId(id, viewerId);
            r.setHasApplied(myApp.isPresent());
            myApp.ifPresent(app -> {
                r.setMyApplicationId(app.getId().toString());
                r.setMyCurrentRoundNumber(app.getCurrentRoundNumber());
            });
            boolean eligible = auditionSeriesEligibilityService.canApply(viewerId, a);
            r.setCanApply(eligible);
            if (!eligible && a.getSeriesRound() > 1) {
                r.setApplyBlockedMessage(AuditionSeriesPresentation.APPLY_BLOCKED_PREV_ROUND_NOT_ACCEPTED);
            }
        }
        if (AuditionProcessModes.isMultiRound(a.getProcessMode())) {
            r.setRoundSummaries(auditionRoundService.listRounds(a.getId()).stream()
                    .map(x -> new AuditionRoundSummaryDto(x.getId().toString(), x.getRoundNumber()))
                    .collect(Collectors.toList()));
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
        boolean patchNewTags = request.getTagIds() != null || request.getCustomTagNames() != null;
        if (patchNewTags) {
            auditionTagService.replaceAuditionTags(
                    id,
                    request.getTagIds() != null ? request.getTagIds() : List.of(),
                    request.getCustomTagNames() != null ? request.getCustomTagNames() : List.of());
        } else if (request.getTags() != null) {
            auditionTagService.replaceFromLegacyList(id, request.getTags());
        }
        if (request.getDeadlineAt() != null) {
            audition.setDeadlineAt(parseInstantOrNull(request.getDeadlineAt()));
        }
        if (request.getImages() != null) {
            applyImagesToEntity(audition, request.getImages());
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
        String publishedOriginal = trimOrNull(audition.getImageOriginalUrl());
        if (publishedOriginal == null) {
            publishedOriginal = trimOrNull(audition.getCoverImage());
        }
        assertCoverImageForPublished(audition.getStatus(), publishedOriginal);

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

    /**
     * 동일 시리즈의 다음 차 공고 생성(DRAFT). 태그 복제, MULTI_ROUND 이면 1라운드 부트스트랩.
     */
    @Transactional
    public AuditionResponse createNextSeriesRound(UUID sourceAuditionId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        Audition source = auditionRepository.findById(sourceAuditionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Audition not found"));
        if (!SecurityUtils.hasRole("ADMIN") && !source.getOwnerId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only owner or ADMIN can add a series round");
        }
        int maxRound = auditionRepository.findMaxSeriesRoundByGroupId(source.getGroupId());
        int nextRound = maxRound + 1;
        String baseTitle = AuditionSeriesPresentation.stripTrailingSeriesRoundSuffix(source.getTitle());
        String newTitle = baseTitle + " (" + nextRound + "차)";

        UUID newId = UUID.randomUUID();
        Audition n = new Audition();
        n.setId(newId);
        n.setGroupId(source.getGroupId());
        n.setSeriesRound(nextRound);
        n.setOwnerId(source.getOwnerId());
        n.setTitle(newTitle);
        n.setDescription(source.getDescription());
        n.setStatus("DRAFT");
        n.setCountryCode(source.getCountryCode());
        n.setDeadlineAt(source.getDeadlineAt());
        n.setCoverImage(source.getCoverImage());
        n.setImageOriginalUrl(source.getImageOriginalUrl());
        n.setImageMediumUrl(source.getImageMediumUrl());
        n.setImageThumbUrl(source.getImageThumbUrl());
        n.setVideoUrl(source.getVideoUrl());
        n.setGalleryImages(source.getGalleryImages());
        n.setAgencyName(source.getAgencyName());
        n.setAgencyLogo(source.getAgencyLogo());
        n.setApplicantsCount(0);
        n.setRecruitFields(source.getRecruitFields());
        n.setQualifications(source.getQualifications());
        n.setSchedules(source.getSchedules());
        n.setLocation(source.getLocation());
        n.setStartDate(source.getStartDate());
        n.setEndDate(source.getEndDate());
        n.setBenefits(source.getBenefits());
        n.setProcessMode(source.getProcessMode());
        if (source.getEndDate() != null) {
            n.setRemainingDays(computeRemainingDays(source.getEndDate()));
        } else {
            n.setRemainingDays(0);
        }
        if (AuditionProcessModes.isMultiRound(source.getProcessMode())) {
            n.setCurrentRoundNumber(1);
            n.setMaxRoundNumber(1);
            n.setSelectionStatus("DRAFT");
        } else {
            n.setCurrentRoundNumber(null);
            n.setMaxRoundNumber(null);
            n.setSelectionStatus(null);
        }
        n.setUpdatedAt(Instant.now());
        n = auditionRepository.save(n);

        List<AuditionTagRefDto> refs = auditionTagService.listRefs(source.getId());
        List<String> tagIds = refs.stream()
                .map(AuditionTagRefDto::getTagId)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
        List<String> customNames = refs.stream()
                .filter(r -> r.getTagId() == null || r.getTagId().isBlank())
                .map(AuditionTagRefDto::getName)
                .filter(name -> name != null && !name.isBlank())
                .map(String::trim)
                .collect(Collectors.toList());
        auditionTagService.replaceAuditionTags(n.getId(), tagIds, customNames);

        if (AuditionProcessModes.isMultiRound(n.getProcessMode())) {
            auditionRoundService.bootstrapFirstRound(n.getId(), false);
        }
        return toResponse(n);
    }
}
