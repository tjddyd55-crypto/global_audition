package com.audition.platform.application.org;

import com.audition.platform.application.org.JdbcContractStore.ContractRow;
import com.audition.platform.application.org.JdbcContractStore.DocumentRow;
import com.audition.platform.application.org.JdbcContractStore.VersionRow;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
public class ContractService {

    private static final Logger log = LoggerFactory.getLogger(ContractService.class);
    private static final int MAX_DOCUMENT_BYTES = 5_000_000;

    private final JdbcContractStore contracts;
    private final JdbcOrgStore org;
    private final OrgAccess access;
    private final ContractObjectStorage storage;

    public ContractService(JdbcContractStore contracts, JdbcOrgStore org, OrgAccess access, ContractObjectStorage storage) {
        this.contracts = contracts;
        this.org = org;
        this.access = access;
        this.storage = storage;
    }

    @Transactional
    public ContractView create(Draft draft) {
        OrgAccess.Actor actor = access.requireHq();
        String country = requireCountry(draft.countryCode());
        String currency = CountryCodes.currency(draft.payoutCurrency());
        if (draft.contractNumber() == null || draft.contractNumber().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CONTRACT_NUMBER_REQUIRED");
        }
        if (draft.counterpartyName() == null || draft.counterpartyName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "COUNTERPARTY_REQUIRED");
        }
        if (draft.startDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "START_DATE_REQUIRED");
        }
        UUID contractId = UUID.randomUUID();
        UUID versionId = UUID.randomUUID();
        contracts.insertContract(
                contractId, draft.contractNumber().trim(), country, draft.crmAgencyId(),
                draft.counterpartyName().trim(), draft.representativeUserId(), draft.contractingEntity(),
                "ACTIVE", actor.id());
        contracts.insertVersion(version(versionId, contractId, 1, draft, currency, actor.id()));
        org.audit(UUID.randomUUID(), "CONTRACT_CREATED", actor.id(), country, "CONTRACT", contractId.toString(), null);
        return view(contracts.find(contractId).orElseThrow(), false);
    }

    @Transactional
    public ContractView addVersion(UUID contractId, Draft draft) {
        OrgAccess.Actor actor = access.requireHq();
        ContractRow current = require(contractId);
        if ("ENDED".equals(current.status())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "CONTRACT_ENDED");
        }
        if (draft.startDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "START_DATE_REQUIRED");
        }
        String currency = draft.payoutCurrency() == null
                ? currentCurrency(contractId)
                : CountryCodes.currency(draft.payoutCurrency());
        int versionNo = contracts.nextVersionNo(contractId);
        contracts.insertVersion(version(UUID.randomUUID(), contractId, versionNo, draft, currency, actor.id()));
        org.audit(UUID.randomUUID(), "CONTRACT_VERSION_ADDED", actor.id(), current.countryCode(), "CONTRACT", contractId.toString(), draft.changeReason());
        return view(current, false);
    }

    @Transactional
    public void end(UUID contractId, String reason) {
        OrgAccess.Actor actor = access.requireHq();
        ContractRow current = require(contractId);
        contracts.end(contractId);
        org.audit(UUID.randomUUID(), "CONTRACT_ENDED", actor.id(), current.countryCode(), "CONTRACT", contractId.toString(), reason);
    }

    public ContractView get(UUID contractId) {
        ContractRow row = require(contractId);
        OrgAccess.Actor actor = access.requireCountry(row.countryCode());
        return view(row, OrgRoles.countryStaff(actor.role()));
    }

    public List<VersionView> versions(UUID contractId) {
        ContractRow row = require(contractId);
        OrgAccess.Actor actor = access.requireCountry(row.countryCode());
        if (OrgRoles.countryStaff(actor.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "CONTRACT_ACCESS_REVOKED");
        }
        return contracts.versions(contractId).stream()
                .map(version -> new VersionView(
                        version.id(), version.versionNo(), version.start(), version.end(),
                        version.rateBps(), version.basis(), version.roundingPolicy(), version.currency(),
                        version.refundDeductionBasis(), version.paymentFeeDeductionBasis(), version.extraDeductionBasis(),
                        version.paymentFeeUsd(), version.extraDeductionUsd()))
                .toList();
    }

    public List<ContractView> list(String rawCountry) {
        String country = CountryCodes.iso2(rawCountry);
        OrgAccess.Actor actor = access.requireCountry(country);
        boolean redact = OrgRoles.countryStaff(actor.role());
        return contracts.listCountry(country).stream().map(row -> view(row, redact)).toList();
    }

    @Transactional
    public void attach(UUID contractId, String filename, String contentType, byte[] body) {
        OrgAccess.Actor actor = access.requireHq();
        ContractRow current = require(contractId);
        if (body == null || body.length == 0 || body.length > MAX_DOCUMENT_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "DOCUMENT_SIZE_INVALID");
        }
        VersionRow latest = latest(contractId);
        String safeName = filename == null || filename.isBlank() ? "contract" : filename;
        String mime = contentType == null || contentType.isBlank() ? "application/octet-stream" : contentType;
        UUID documentId = UUID.randomUUID();
        contracts.insertDocument(documentId, contractId, latest.id(), safeName, mime, body, actor.id());
        if (storage.ready()) {
            try {
                storeObject(contractId, latest.id(), documentId, safeName, mime, body, actor.id());
            } catch (RuntimeException ex) {
                log.warn("contract object storage unavailable; bytea retained: {}", ex.toString());
            }
        }
        org.audit(UUID.randomUUID(), "CONTRACT_DOCUMENT_ATTACHED", actor.id(), current.countryCode(), "CONTRACT", contractId.toString(), null);
    }

    @Transactional
    public MigrateResult migrateLegacyFiles() {
        access.requireHq();
        if (!storage.ready()) {
            return new MigrateResult(0, contracts.countDocuments(), "BLOCKED_STORAGE_UNAVAILABLE");
        }
        int migrated = 0;
        int failed = 0;
        for (JdbcContractStore.LegacyDocument document : contracts.unmigratedDocuments()) {
            try {
                storeObject(
                        document.contractId(), document.versionId(), document.id(),
                        document.filename(), document.contentType(), document.body(), document.createdBy());
                migrated++;
            } catch (RuntimeException ex) {
                failed++;
                log.warn("contract file migration blocked; bytea retained: {}", ex.toString());
            }
        }
        if (migrated == 0) {
            return new MigrateResult(0, contracts.countDocuments(), "BLOCKED_STORAGE_UNAVAILABLE");
        }
        return new MigrateResult(migrated, contracts.countDocuments(), failed == 0 ? "BYTEA_RETAINED" : "PARTIAL_BYTEA_RETAINED");
    }

    public Presign presign(UUID contractId) {
        requireReadable(contractId);
        JdbcContractStore.FileRow file = contracts.latestFile(contractId)
                .filter(JdbcContractStore.FileRow::integrityVerified)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "STORAGE_UNAVAILABLE"));
        if (!storage.ready()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "STORAGE_UNAVAILABLE");
        }
        String url = storage.presignGet(file.storageKey(), ContractObjectStorage.DOWNLOAD_TTL);
        return new Presign(file.id(), url, Instant.now().plus(ContractObjectStorage.DOWNLOAD_TTL));
    }

    public DocumentRow download(UUID contractId) {
        requireReadable(contractId);
        return contracts.latestDocument(contractId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "DOCUMENT_NOT_FOUND"));
    }

    public List<JdbcContractStore.DocumentMeta> documents(UUID contractId) {
        requireReadable(contractId);
        return contracts.listDocumentMeta(contractId);
    }

    private void requireReadable(UUID contractId) {
        ContractRow current = require(contractId);
        if (!"ACTIVE".equals(current.status())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "CONTRACT_ACCESS_REVOKED");
        }
        OrgAccess.Actor actor = access.requireCountry(current.countryCode());
        if (OrgRoles.countryStaff(actor.role()) || OrgRoles.agencyOperator(actor.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "CONTRACT_ACCESS_REVOKED");
        }
    }

    private void storeObject(
            UUID contractId, UUID versionId, UUID legacyDocumentId,
            String filename, String mime, byte[] body, UUID actor) {
        UUID fileId = UUID.randomUUID();
        String key = "contracts/" + contractId + "/" + fileId;
        String hash = sha256(body);
        storage.put(key, body, mime);
        byte[] stored = storage.get(key);
        if (!hash.equals(sha256(stored)) || stored.length != body.length) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "STORAGE_INTEGRITY_FAILED");
        }
        contracts.insertFile(new JdbcContractStore.FileRow(
                fileId, contractId, versionId, legacyDocumentId, key, filename, body.length, mime, hash, actor, true));
    }

    private static String sha256(byte[] body) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(body));
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "HASH_FAILED");
        }
    }

    private VersionRow version(UUID id, UUID contractId, int versionNo, Draft draft, String currency, UUID approver) {
        String rounding = blankToNull(draft.roundingPolicy());
        return new VersionRow(
                id, contractId, versionNo, draft.startDate(), draft.endDate(),
                draft.revenueShareBps(), blankToNull(draft.settlementBasis()), rounding, currency,
                draft.paymentFeeUsd(), draft.extraDeductionUsd(), approver, draft.changeReason(),
                blankToNull(draft.refundDeductionBasis()),
                blankToNull(draft.paymentFeeDeductionBasis()),
                blankToNull(draft.extraDeductionBasis()));
    }

    private ContractView view(ContractRow row, boolean redactRates) {
        VersionRow latest = latest(row.id());
        boolean document = contracts.latestDocument(row.id()).isPresent();
        return new ContractView(
                row.id(), row.number(), row.countryCode(), row.agencyId(), row.counterparty(),
                row.representativeUserId(), row.entity(), row.status(), latest.versionNo(),
                redactRates ? null : latest.rateBps(),
                redactRates ? null : latest.basis(),
                redactRates ? null : latest.roundingPolicy(),
                redactRates ? null : latest.currency(),
                redactRates ? null : latest.paymentFeeUsd(),
                redactRates ? null : latest.extraDeductionUsd(),
                latest.start(), latest.end(), document,
                redactRates ? null : latest.refundDeductionBasis(),
                redactRates ? null : latest.paymentFeeDeductionBasis(),
                redactRates ? null : latest.extraDeductionBasis(),
                "MONTHLY");
    }

    private VersionRow latest(UUID contractId) {
        List<VersionRow> versions = contracts.versions(contractId);
        if (versions.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "CONTRACT_VERSION_MISSING");
        }
        return versions.get(versions.size() - 1);
    }

    private String currentCurrency(UUID contractId) {
        return latest(contractId).currency();
    }

    private ContractRow require(UUID id) {
        return contracts.find(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CONTRACT_NOT_FOUND"));
    }

    private String requireCountry(String raw) {
        String code = CountryCodes.iso2(raw);
        if (!org.countryExists(code)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "COUNTRY_NOT_FOUND");
        }
        return code;
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    public record Draft(
            String contractNumber,
            String countryCode,
            UUID crmAgencyId,
            String counterpartyName,
            UUID representativeUserId,
            String contractingEntity,
            LocalDate startDate,
            LocalDate endDate,
            Integer revenueShareBps,
            String settlementBasis,
            String roundingPolicy,
            String payoutCurrency,
            Long paymentFeeUsd,
            Long extraDeductionUsd,
            String changeReason,
            String refundDeductionBasis,
            String paymentFeeDeductionBasis,
            String extraDeductionBasis) {
    }

    public record ContractView(
            UUID id,
            String contractNumber,
            String countryCode,
            UUID crmAgencyId,
            String counterpartyName,
            UUID representativeUserId,
            String contractingEntity,
            String status,
            int versionNo,
            Integer revenueShareBps,
            String settlementBasis,
            String roundingPolicy,
            String payoutCurrency,
            Long paymentFeeUsd,
            Long extraDeductionUsd,
            LocalDate startDate,
            LocalDate endDate,
            boolean documentAvailable,
            String refundDeductionBasis,
            String paymentFeeDeductionBasis,
            String extraDeductionBasis,
            String cycle) {
    }

    public record VersionView(
            UUID id,
            int versionNo,
            LocalDate startDate,
            LocalDate endDate,
            Integer revenueShareBps,
            String settlementBasis,
            String roundingPolicy,
            String payoutCurrency,
            String refundDeductionBasis,
            String paymentFeeDeductionBasis,
            String extraDeductionBasis,
            Long paymentFeeUsd,
            Long extraDeductionUsd) {
    }

    public record Presign(UUID fileId, String url, Instant expiresAt) {
    }

    public record MigrateResult(int migrated, int byteaRetained, String status) {
    }
}
