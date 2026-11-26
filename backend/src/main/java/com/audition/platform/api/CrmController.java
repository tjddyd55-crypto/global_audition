package com.audition.platform.api;

import com.audition.platform.application.org.CrmService;
import com.audition.platform.application.org.CrmService.AgencyDraft;
import com.audition.platform.application.org.JdbcCrmStore.AgencyRow;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/org/crm/agencies")
public class CrmController {

    private final CrmService crm;

    public CrmController(CrmService crm) {
        this.crm = crm;
    }

    @GetMapping("/self")
    public List<CrmService.AgencySelf> self() {
        return crm.own();
    }

    @GetMapping("/activities")
    public List<com.audition.platform.application.org.JdbcCrmStore.ActivityCount> activities(@RequestParam String country) {
        return crm.activities(country);
    }

    @GetMapping("/activity-log")
    public List<com.audition.platform.application.org.JdbcCrmStore.ActivityRow> activityLog(
            @RequestParam String country,
            @RequestParam(required = false) UUID agencyId) {
        return crm.activityLog(country, agencyId);
    }

    @GetMapping
    public List<AgencyRow> list(@RequestParam String country) {
        return crm.list(country);
    }

    @PostMapping
    public AgencyRow register(@RequestBody AgencyDraft draft) {
        return crm.register(draft);
    }

    @PostMapping("/{id}/stage")
    public AgencyRow stage(@PathVariable UUID id, @RequestBody StageRequest request, @RequestParam(required = false) String country) {
        return crm.changeStage(id, request.stage(), request.reason(), country);
    }

    @PatchMapping("/{id}/contact")
    public AgencyRow updateContact(@PathVariable UUID id, @RequestParam String country, @Valid @RequestBody ContactRequest request) {
        return crm.updateContact(id, country, request.displayName(), request.contactName(), request.contactPhone());
    }

    public record ContactRequest(@NotBlank @Size(max = 200) String displayName,
                                 @Size(max = 120) String contactName,
                                 @Size(max = 80) String contactPhone) {
    }

    @PostMapping("/{id}/decision")
    public AgencyRow decision(@PathVariable UUID id, @RequestBody DecisionRequest request, @RequestParam(required = false) String country) {
        return crm.decide(id, request.action(), request.reason(), request.linkedUserId(), country);
    }

    @PostMapping("/{id}/auditions/{auditionId}")
    public void linkAudition(@PathVariable UUID id, @PathVariable UUID auditionId) {
        crm.linkAudition(id, auditionId);
    }

    @PostMapping("/{id}/consultations")
    public void consult(@PathVariable UUID id, @RequestBody NoteRequest request, @RequestParam(required = false) String country) {
        crm.logConsult(id, request.body(), request.followUpOn(), country);
    }

    @PatchMapping("/activity-log/{activityId}")
    public com.audition.platform.application.org.JdbcCrmStore.ActivityRow editConsult(
            @PathVariable UUID activityId, @RequestBody NoteRequest request, @RequestParam(required = false) String country) {
        return crm.editConsult(activityId, request.body(), request.followUpOn(), country);
    }

    public record StageRequest(String stage, String reason) {
    }

    public record DecisionRequest(String action, String reason, UUID linkedUserId) {
    }

    public record NoteRequest(String body, LocalDate followUpOn) {
    }
}
