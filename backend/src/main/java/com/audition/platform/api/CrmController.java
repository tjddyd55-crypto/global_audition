package com.audition.platform.api;

import com.audition.platform.application.org.CrmService;
import com.audition.platform.application.org.CrmService.AgencyDraft;
import com.audition.platform.application.org.JdbcCrmStore.AgencyRow;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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

    @GetMapping
    public List<AgencyRow> list(@RequestParam String country) {
        return crm.list(country);
    }

    @PostMapping
    public AgencyRow register(@RequestBody AgencyDraft draft) {
        return crm.register(draft);
    }

    @PostMapping("/{id}/stage")
    public AgencyRow stage(@PathVariable UUID id, @RequestBody StageRequest request) {
        return crm.changeStage(id, request.stage(), request.reason());
    }

    @PostMapping("/{id}/decision")
    public AgencyRow decision(@PathVariable UUID id, @RequestBody DecisionRequest request) {
        return crm.decide(id, request.action(), request.reason(), request.linkedUserId());
    }

    @PostMapping("/{id}/consultations")
    public void consult(@PathVariable UUID id, @RequestBody NoteRequest request) {
        crm.logConsult(id, request.body());
    }

    public record StageRequest(String stage, String reason) {
    }

    public record DecisionRequest(String action, String reason, UUID linkedUserId) {
    }

    public record NoteRequest(String body) {
    }
}
