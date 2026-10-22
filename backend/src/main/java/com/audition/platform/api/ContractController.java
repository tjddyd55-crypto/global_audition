package com.audition.platform.api;

import com.audition.platform.application.org.ContractService;
import com.audition.platform.application.org.ContractService.ContractView;
import com.audition.platform.application.org.ContractService.Draft;
import com.audition.platform.application.org.JdbcContractStore.DocumentRow;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/org/contracts")
public class ContractController {

    private final ContractService contracts;

    public ContractController(ContractService contracts) {
        this.contracts = contracts;
    }

    @GetMapping
    public List<ContractView> list(@RequestParam String country) {
        return contracts.list(country);
    }

    @GetMapping("/{id}")
    public ContractView get(@PathVariable UUID id) {
        return contracts.get(id);
    }

    @PostMapping
    public ContractView create(@RequestBody Draft draft) {
        return contracts.create(draft);
    }

    @PostMapping("/{id}/versions")
    public ContractView version(@PathVariable UUID id, @RequestBody Draft draft) {
        return contracts.addVersion(id, draft);
    }

    @PostMapping("/{id}/end")
    public void end(@PathVariable UUID id, @RequestBody EndRequest request) {
        contracts.end(id, request.reason());
    }

    @PostMapping(value = "/{id}/document", consumes = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public void attach(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Filename", required = false) String filename,
            @RequestHeader(value = "Content-Type", required = false) String contentType,
            @RequestBody byte[] body) {
        contracts.attach(id, filename, contentType, body);
    }

    @GetMapping("/{id}/document")
    public ResponseEntity<byte[]> download(@PathVariable UUID id) {
        DocumentRow document = contracts.download(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + document.filename().replace("\"", "") + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(document.body());
    }

    public record EndRequest(String reason) {
    }
}
