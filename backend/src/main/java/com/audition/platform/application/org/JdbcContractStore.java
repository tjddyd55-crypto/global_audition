package com.audition.platform.application.org;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class JdbcContractStore {

    private final JdbcTemplate jdbc;

    public JdbcContractStore(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void insertContract(
            UUID id,
            String number,
            String country,
            UUID agencyId,
            String counterparty,
            UUID representativeUserId,
            String entity,
            String status,
            UUID createdBy) {
        jdbc.update("""
                INSERT INTO contracts (
                    id, contract_number, country_code, crm_agency_id, counterparty_name,
                    representative_user_id, contracting_entity, status, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, id, number, country, agencyId, counterparty, representativeUserId, entity, status, createdBy);
    }

    public void insertVersion(VersionRow row) {
        jdbc.update("""
                INSERT INTO contract_versions (
                    id, contract_id, version_no, start_date, end_date, revenue_share_bps,
                    settlement_basis, rounding_policy, payout_currency, cycle,
                    payment_fee_usd, extra_deduction_usd, approved_by, change_reason,
                    refund_deduction_basis, payment_fee_deduction_basis, extra_deduction_basis
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'MONTHLY', ?, ?, ?, ?, ?, ?, ?)
                """,
                row.id(), row.contractId(), row.versionNo(), Date.valueOf(row.start()),
                row.end() == null ? null : Date.valueOf(row.end()),
                row.rateBps(), row.basis(), row.roundingPolicy(), row.currency(),
                row.paymentFeeUsd(), row.extraDeductionUsd(), row.approvedBy(), row.changeReason(),
                row.refundDeductionBasis(), row.paymentFeeDeductionBasis(), row.extraDeductionBasis());
    }

    public int nextVersionNo(UUID contractId) {
        Integer max = jdbc.queryForObject(
                "SELECT COALESCE(MAX(version_no), 0) FROM contract_versions WHERE contract_id = ?",
                Integer.class, contractId);
        return (max == null ? 0 : max) + 1;
    }

    public Optional<ContractRow> find(UUID id) {
        List<ContractRow> rows = jdbc.query("""
                SELECT id, contract_number, country_code, crm_agency_id, counterparty_name,
                       representative_user_id, contracting_entity, status
                FROM contracts WHERE id = ?
                """, (rs, n) -> new ContractRow(
                rs.getObject("id", UUID.class),
                rs.getString("contract_number"),
                rs.getString("country_code").trim(),
                rs.getObject("crm_agency_id", UUID.class),
                rs.getString("counterparty_name"),
                rs.getObject("representative_user_id", UUID.class),
                rs.getString("contracting_entity"),
                rs.getString("status")), id);
        return rows.stream().findFirst();
    }

    public List<ContractRow> listCountry(String country) {
        return jdbc.query("""
                SELECT id, contract_number, country_code, crm_agency_id, counterparty_name,
                       representative_user_id, contracting_entity, status
                FROM contracts WHERE country_code = ? ORDER BY created_at
                """, (rs, n) -> new ContractRow(
                rs.getObject("id", UUID.class),
                rs.getString("contract_number"),
                rs.getString("country_code").trim(),
                rs.getObject("crm_agency_id", UUID.class),
                rs.getString("counterparty_name"),
                rs.getObject("representative_user_id", UUID.class),
                rs.getString("contracting_entity"),
                rs.getString("status")), country);
    }

    public List<VersionRow> versions(UUID contractId) {
        return jdbc.query("""
                SELECT id, contract_id, version_no, start_date, end_date, revenue_share_bps,
                       settlement_basis, rounding_policy, payout_currency,
                       payment_fee_usd, extra_deduction_usd, approved_by, change_reason,
                       refund_deduction_basis, payment_fee_deduction_basis, extra_deduction_basis
                FROM contract_versions WHERE contract_id = ? ORDER BY version_no
                """, (rs, n) -> mapVersion(rs), contractId);
    }

    public void end(UUID id) {
        jdbc.update("""
                UPDATE contracts SET status = 'ENDED', ended_at = NOW(), updated_at = NOW()
                WHERE id = ? AND status <> 'ENDED'
                """, id);
    }

    public void markActive(UUID id) {
        jdbc.update("""
                UPDATE contracts SET status = 'ACTIVE', updated_at = NOW()
                WHERE id = ? AND status = 'DRAFT'
                """, id);
    }

    public void insertDocument(UUID id, UUID contractId, UUID versionId, String filename, String contentType, byte[] body, UUID actor) {
        jdbc.update("""
                INSERT INTO contract_documents (id, contract_id, version_id, filename, content_type, body, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """, id, contractId, versionId, filename, contentType, body, actor);
    }

    public void insertFile(FileRow row) {
        jdbc.update("""
                INSERT INTO contract_files (
                    id, contract_id, contract_version_id, legacy_document_id, storage_key,
                    original_filename, size_bytes, mime, sha256, uploaded_by, integrity_verified, verified_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? THEN NOW() ELSE NULL END)
                """,
                row.id(), row.contractId(), row.versionId(), row.legacyDocumentId(), row.storageKey(),
                row.filename(), row.sizeBytes(), row.mime(), row.sha256(), row.uploadedBy(),
                row.integrityVerified(), row.integrityVerified());
    }

    public Optional<FileRow> latestFile(UUID contractId) {
        List<FileRow> rows = jdbc.query("""
                SELECT id, contract_id, contract_version_id, legacy_document_id, storage_key,
                       original_filename, size_bytes, mime, sha256, uploaded_by, integrity_verified
                FROM contract_files WHERE contract_id = ? ORDER BY uploaded_at DESC LIMIT 1
                """, (rs, n) -> new FileRow(
                rs.getObject("id", UUID.class),
                rs.getObject("contract_id", UUID.class),
                rs.getObject("contract_version_id", UUID.class),
                rs.getObject("legacy_document_id", UUID.class),
                rs.getString("storage_key"),
                rs.getString("original_filename"),
                rs.getLong("size_bytes"),
                rs.getString("mime"),
                rs.getString("sha256"),
                rs.getObject("uploaded_by", UUID.class),
                rs.getBoolean("integrity_verified")), contractId);
        return rows.stream().findFirst();
    }

    public List<LegacyDocument> unmigratedDocuments() {
        return jdbc.query("""
                SELECT d.id, d.contract_id, d.version_id, d.filename, d.content_type, d.body, d.created_by
                FROM contract_documents d
                WHERE NOT EXISTS (
                    SELECT 1 FROM contract_files f WHERE f.legacy_document_id = d.id AND f.integrity_verified
                )
                ORDER BY d.created_at
                """, (rs, n) -> new LegacyDocument(
                rs.getObject("id", UUID.class),
                rs.getObject("contract_id", UUID.class),
                rs.getObject("version_id", UUID.class),
                rs.getString("filename"),
                rs.getString("content_type"),
                rs.getBytes("body"),
                rs.getObject("created_by", UUID.class)));
    }

    public int countDocuments() {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM contract_documents", Integer.class);
        return count == null ? 0 : count;
    }

    public Optional<DocumentRow> latestDocument(UUID contractId) {
        List<DocumentRow> rows = jdbc.query("""
                SELECT id, filename, content_type, body
                FROM contract_documents WHERE contract_id = ? ORDER BY created_at DESC LIMIT 1
                """, (rs, n) -> new DocumentRow(
                rs.getObject("id", UUID.class),
                rs.getString("filename"),
                rs.getString("content_type"),
                rs.getBytes("body")), contractId);
        return rows.stream().findFirst();
    }

    public List<AttributionPlanner.Window> windowsForBranches(List<UUID> branchIds) {
        if (branchIds.isEmpty()) {
            return List.of();
        }
        String placeholders = String.join(",", branchIds.stream().map(id -> "?").toList());
        return jdbc.query("""
                SELECT v.id AS version_id, v.contract_id, v.version_no, c.country_code, c.crm_agency_id,
                       v.start_date, v.end_date
                FROM contract_versions v
                JOIN contracts c ON c.id = v.contract_id
                WHERE c.crm_agency_id IN (""" + placeholders + """
                )
                ORDER BY v.version_no
                """, (rs, n) -> new AttributionPlanner.Window(
                rs.getObject("contract_id", UUID.class),
                rs.getObject("version_id", UUID.class),
                rs.getInt("version_no"),
                rs.getString("country_code").trim(),
                rs.getObject("crm_agency_id", UUID.class),
                rs.getDate("start_date").toLocalDate(),
                rs.getDate("end_date") == null ? null : rs.getDate("end_date").toLocalDate()),
                branchIds.toArray());
    }

    private static VersionRow mapVersion(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new VersionRow(
                rs.getObject("id", UUID.class),
                rs.getObject("contract_id", UUID.class),
                rs.getInt("version_no"),
                rs.getDate("start_date").toLocalDate(),
                rs.getDate("end_date") == null ? null : rs.getDate("end_date").toLocalDate(),
                (Integer) rs.getObject("revenue_share_bps"),
                rs.getString("settlement_basis"),
                rs.getString("rounding_policy"),
                rs.getString("payout_currency").trim(),
                (Long) rs.getObject("payment_fee_usd"),
                (Long) rs.getObject("extra_deduction_usd"),
                rs.getObject("approved_by", UUID.class),
                rs.getString("change_reason"),
                rs.getString("refund_deduction_basis"),
                rs.getString("payment_fee_deduction_basis"),
                rs.getString("extra_deduction_basis"));
    }

    public record ContractRow(
            UUID id,
            String number,
            String countryCode,
            UUID agencyId,
            String counterparty,
            UUID representativeUserId,
            String entity,
            String status) {
    }

    public record VersionRow(
            UUID id,
            UUID contractId,
            int versionNo,
            LocalDate start,
            LocalDate end,
            Integer rateBps,
            String basis,
            String roundingPolicy,
            String currency,
            Long paymentFeeUsd,
            Long extraDeductionUsd,
            UUID approvedBy,
            String changeReason,
            String refundDeductionBasis,
            String paymentFeeDeductionBasis,
            String extraDeductionBasis) {
    }

    public record DocumentRow(UUID id, String filename, String contentType, byte[] body) {
    }

    public record FileRow(
            UUID id,
            UUID contractId,
            UUID versionId,
            UUID legacyDocumentId,
            String storageKey,
            String filename,
            long sizeBytes,
            String mime,
            String sha256,
            UUID uploadedBy,
            boolean integrityVerified) {
    }

    public record LegacyDocument(
            UUID id,
            UUID contractId,
            UUID versionId,
            String filename,
            String contentType,
            byte[] body,
            UUID createdBy) {
    }
}
