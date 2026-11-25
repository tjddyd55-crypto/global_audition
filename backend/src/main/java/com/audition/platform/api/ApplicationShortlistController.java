package com.audition.platform.api;

import com.audition.platform.application.applications.ApplicationShortlistService;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/auditions/{auditionId}/applications/shortlist")
public class ApplicationShortlistController {
    private final ApplicationShortlistService service;
    public ApplicationShortlistController(ApplicationShortlistService service) { this.service = service; }
    public record Change(List<UUID> applicationIds, boolean saved) {}
    public record Memo(String memo) {}
    @GetMapping public Collection<ApplicationShortlistService.Saved> list(@PathVariable UUID auditionId, @RequestParam(defaultValue="0") int round) { return service.list(auditionId, round).values(); }
    @PostMapping public void change(@PathVariable UUID auditionId, @RequestParam(defaultValue="0") int round, @RequestBody Change body) { service.change(auditionId, round, body.applicationIds(), body.saved()); }
    @PutMapping("/{applicationId}/memo") public void memo(@PathVariable UUID auditionId, @PathVariable UUID applicationId, @RequestParam(defaultValue="0") int round, @RequestBody Memo body) { service.memo(auditionId, round, applicationId, body.memo()); }
}
