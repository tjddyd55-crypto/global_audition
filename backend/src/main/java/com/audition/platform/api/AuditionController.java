package com.audition.platform.api;

import com.audition.platform.api.dto.ApiFailResponse;
import com.audition.platform.api.dto.AuditionResponse;
import com.audition.platform.api.dto.AuditionTranslationUpsertRequest;
import com.audition.platform.api.dto.AuditionTranslationView;
import com.audition.platform.api.dto.CreateAuditionRequest;
import com.audition.platform.api.dto.TranslationJobRequest;
import com.audition.platform.api.dto.TranslationProviderStatusView;
import com.audition.platform.api.dto.UpdateAuditionRequest;
import com.audition.platform.application.AuditionService;
import com.audition.platform.application.publicview.PublicAuditionBrowse;
import com.audition.platform.application.i18n.AuditionAutoTranslationService;
import com.audition.platform.application.i18n.AuditionLocalizationService;
import com.audition.platform.infra.SecurityUtils;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/auditions")
public class AuditionController {

    private static final Logger log = LoggerFactory.getLogger(AuditionController.class);

    private final AuditionService auditionService;
    private final AuditionLocalizationService auditionLocalizationService;
    private final AuditionAutoTranslationService auditionAutoTranslationService;

    public AuditionController(
            AuditionService auditionService,
            AuditionLocalizationService auditionLocalizationService,
            AuditionAutoTranslationService auditionAutoTranslationService) {
        this.auditionService = auditionService;
        this.auditionLocalizationService = auditionLocalizationService;
        this.auditionAutoTranslationService = auditionAutoTranslationService;
    }

    @PostMapping
    public AuditionResponse create(@Valid @RequestBody CreateAuditionRequest request) {
        return auditionService.create(request);
    }

    @GetMapping
    public List<AuditionResponse> list(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "country", required = false) String country) {
        if (status == null || status.isBlank() || "OPEN".equals(status)) {
            return auditionService.listOpen(country);
        }
        if (!SecurityUtils.hasRole("AGENCY") && !SecurityUtils.hasRole("ADMIN") && !SecurityUtils.hasRole("SUPER_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only AGENCY or ADMIN can query non-open auditions");
        }
        return auditionService.listByStatus(status);
    }

    @GetMapping("/browse")
    public List<AuditionResponse> browse(
            @RequestParam(required = false) String recruitment,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String agency,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        String status = recruitment == null ? null : recruitment.trim().toUpperCase(Locale.ROOT);
        if (status != null && !status.isBlank() && !Set.of("OPEN", "CLOSED", "ENDED", "ALL").contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "recruitment 값이 올바르지 않습니다.");
        }
        return auditionService.browsePublic(new PublicAuditionBrowse.Query(
                status, country, category, agency, q, startOfDay(from), endOfDay(to)));
    }

    @GetMapping("/my")
    public List<AuditionResponse> listMy() {
        return auditionService.listMine();
    }

    @GetMapping("/mine")
    public List<AuditionResponse> listMineLegacy() {
        return auditionService.listMine();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(auditionService.getById(id));
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("AUDITION DETAIL ERROR:", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiFailResponse("오디션 상세 조회 실패"));
        }
    }

    @PatchMapping("/{id}")
    public AuditionResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateAuditionRequest request) {
        return auditionService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        auditionService.delete(id);
    }

    /** 기획사·관리자: 동일 group_id 로 다음 시리즈 차수 공고 생성(DRAFT). */
    @PostMapping("/{id}/series/next-round")
    public AuditionResponse createNextSeriesRound(@PathVariable UUID id) {
        return auditionService.createNextSeriesRound(id);
    }

    @GetMapping("/{id}/preview")
    public AuditionResponse preview(
            @PathVariable UUID id,
            @RequestParam(value = "locale", required = false) String locale) {
        return auditionService.preview(id, locale);
    }

    @GetMapping("/{id}/translation-provider")
    public TranslationProviderStatusView translationProvider(@PathVariable UUID id) {
        return auditionAutoTranslationService.providerStatus(id);
    }

    @PostMapping("/{id}/translation-jobs")
    public List<AuditionTranslationView> translationJobs(
            @PathVariable UUID id,
            @RequestBody(required = false) TranslationJobRequest request) {
        TranslationJobRequest body = request == null ? new TranslationJobRequest() : request;
        if (body.getLocale() == null || body.getLocale().isBlank()) {
            return auditionAutoTranslationService.translateAll(id, body.isForce());
        }
        return List.of(auditionAutoTranslationService.translateLocale(id, body.getLocale(), body.isForce()));
    }

    @GetMapping("/{id}/translations")
    public List<AuditionTranslationView> listTranslations(@PathVariable UUID id) {
        return auditionLocalizationService.list(id);
    }

    @PutMapping("/{id}/translations/{locale}")
    public AuditionTranslationView upsertTranslation(
            @PathVariable UUID id,
            @PathVariable String locale,
            @Valid @RequestBody AuditionTranslationUpsertRequest request) {
        return auditionLocalizationService.upsert(id, locale, request);
    }

    private static Instant startOfDay(String raw) {
        LocalDate day = parseDay(raw);
        return day == null ? null : day.atStartOfDay().toInstant(ZoneOffset.UTC);
    }

    private static Instant endOfDay(String raw) {
        LocalDate day = parseDay(raw);
        return day == null ? null : day.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC).minusMillis(1);
    }

    private static LocalDate parseDay(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(raw.trim());
        } catch (DateTimeParseException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "날짜 형식이 올바르지 않습니다.");
        }
    }
}
