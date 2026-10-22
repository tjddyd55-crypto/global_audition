package com.audition.platform.application.org;

import com.audition.platform.application.org.JdbcCrmStore.AgencyRow;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class CrmService {

    private static final Set<String> STAGES = Set.of(
            "LEAD", "CONTACTED", "MEETING", "REVIEW", "CONTRACTED", "ACTIVE", "STOPPED", "REJECTED", "DORMANT");

    private final JdbcCrmStore crm;
    private final JdbcOrgStore org;
    private final OrgAccess access;

    public CrmService(JdbcCrmStore crm, JdbcOrgStore org, OrgAccess access) {
        this.crm = crm;
        this.org = org;
        this.access = access;
    }

    @Transactional
    public AgencyRow register(AgencyDraft draft) {
        String code = CountryCodes.iso2(draft.countryCode());
        OrgAccess.Actor actor = access.requireCountry(code);
        access.requireStaffPermission(actor, code, OrgRoles.PERM_CRM_WRITE);
        if (draft.displayName() == null || draft.displayName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "AGENCY_NAME_REQUIRED");
        }
        UUID id = UUID.randomUUID();
        AgencyRow row = new AgencyRow(
                id, code, draft.displayName().trim(), draft.legalName(), draft.businessRegistration(),
                draft.contactName(), draft.contactEmail(), draft.contactPhone(), draft.website(),
                draft.assignedStaffUserId(), "LEAD", AgencyApproval.PENDING, draft.linkedUserId(), draft.notes());
        crm.insertAgency(row);
        crm.stageEvent(UUID.randomUUID(), id, null, "LEAD", actor.id(), "REGISTERED");
        crm.approvalEvent(UUID.randomUUID(), id, null, AgencyApproval.PENDING, "REGISTER", actor.id(), null);
        if (OrgRoles.countryStaff(actor.role())) {
            org.activeStaffAssignment(code, actor.id()).ifPresent(assignment -> crm.assign(assignment, id));
        }
        if (draft.assignedStaffUserId() != null) {
            org.activeStaffAssignment(code, draft.assignedStaffUserId()).ifPresent(assignment -> crm.assign(assignment, id));
        }
        org.audit(UUID.randomUUID(), "CRM_AGENCY_REGISTERED", actor.id(), code, "CRM_AGENCY", id.toString(), null);
        return row;
    }

    public List<AgencyRow> list(String rawCountry) {
        String code = CountryCodes.iso2(rawCountry);
        OrgAccess.Actor actor = access.requireCountry(code);
        if (OrgRoles.countryStaff(actor.role())) {
            access.requireStaffPermission(actor, code, OrgRoles.PERM_CRM_READ);
            return crm.listAssigned(actor.id(), code);
        }
        return crm.listCountry(code);
    }

    @Transactional
    public AgencyRow changeStage(UUID id, String stage, String reason) {
        AgencyRow current = requireVisible(id);
        if (!STAGES.contains(stage)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "STAGE_INVALID");
        }
        OrgAccess.Actor actor = access.requireCountry(current.countryCode());
        access.requireStaffPermission(actor, current.countryCode(), OrgRoles.PERM_CRM_WRITE);
        access.requireAssignedAgency(actor, current.countryCode(), id);
        crm.updateState(id, stage, current.approvalState(), null);
        crm.stageEvent(UUID.randomUUID(), id, current.stage(), stage, actor.id(), reason);
        return crm.find(id).orElseThrow();
    }

    @Transactional
    public AgencyRow decide(UUID id, String action, String reason, UUID linkedUserId) {
        AgencyRow current = requireVisible(id);
        OrgAccess.Actor actor = access.requireCountry(current.countryCode());
        boolean hq = OrgRoles.hq(actor.role());
        if (!hq) {
            access.requireStaffPermission(actor, current.countryCode(), OrgRoles.PERM_AGENCY_REVIEW);
            access.requireAssignedAgency(actor, current.countryCode(), id);
        }
        String next = AgencyApproval.next(current.approvalState(), action, hq);
        String stage = current.stage();
        if (AgencyApproval.APPROVED.equals(next)) {
            stage = "ACTIVE";
        } else if (AgencyApproval.REJECTED.equals(next)) {
            stage = "REJECTED";
        } else if (AgencyApproval.SUSPENDED.equals(next)) {
            stage = "STOPPED";
        }
        crm.updateState(id, stage, next, linkedUserId);
        crm.approvalEvent(UUID.randomUUID(), id, current.approvalState(), next, action, actor.id(), reason);
        if (!stage.equals(current.stage())) {
            crm.stageEvent(UUID.randomUUID(), id, current.stage(), stage, actor.id(), reason);
        }
        if (AgencyApproval.APPROVED.equals(next) && linkedUserId != null && !OrgRoles.hq(org.roleOf(linkedUserId))) {
            org.setRoleIfNotHq(linkedUserId, OrgRoles.AGENCY);
        }
        org.audit(UUID.randomUUID(), "CRM_APPROVAL_" + action, actor.id(), current.countryCode(), "CRM_AGENCY", id.toString(), reason);
        return crm.find(id).orElseThrow();
    }

    @Transactional
    public void logConsult(UUID id, String body) {
        logConsult(id, body, null);
    }

    @Transactional
    public void logConsult(UUID id, String body, LocalDate followUpOn) {
        AgencyRow current = requireVisible(id);
        OrgAccess.Actor actor = access.requireCountry(current.countryCode());
        access.requireStaffPermission(actor, current.countryCode(), OrgRoles.PERM_CONSULT_LOG);
        access.requireAssignedAgency(actor, current.countryCode(), id);
        if (body == null || body.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "NOTE_REQUIRED");
        }
        crm.activity(UUID.randomUUID(), id, current.countryCode(), actor.id(), "CONSULT", body.trim(), followUpOn);
    }

    @Transactional
    public JdbcCrmStore.ActivityRow editConsult(UUID activityId, String body, LocalDate followUpOn) {
        JdbcCrmStore.ActivityRow current = crm.findActivity(activityId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CONSULT_NOT_FOUND"));
        if (!"CONSULT".equals(current.kind())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "CONSULT_ONLY");
        }
        AgencyRow agency = requireVisible(current.agencyId());
        OrgAccess.Actor actor = access.requireCountry(agency.countryCode());
        access.requireStaffPermission(actor, agency.countryCode(), OrgRoles.PERM_CONSULT_LOG);
        access.requireAssignedAgency(actor, agency.countryCode(), agency.id());
        if (body == null || body.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "NOTE_REQUIRED");
        }
        UUID onlyStaff = OrgRoles.countryStaff(actor.role()) ? actor.id() : null;
        if (crm.updateConsult(activityId, agency.countryCode(), onlyStaff, body.trim(), followUpOn) != 1) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "CONSULT_NOT_OWNED");
        }
        org.audit(UUID.randomUUID(), "CRM_CONSULT_EDITED", actor.id(), agency.countryCode(), "CRM_ACTIVITY", activityId.toString(), null);
        return crm.findActivity(activityId).orElseThrow();
    }

    @Transactional
    public void linkAudition(UUID agencyId, UUID auditionId) {
        AgencyRow agency = requireVisible(agencyId);
        OrgAccess.Actor actor = access.requireCountry(agency.countryCode());
        if (OrgRoles.countryStaff(actor.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "STAFF_PERMISSION_DENIED");
        }
        if (!AgencyApproval.APPROVED.equals(agency.approvalState())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "AGENCY_NOT_APPROVED");
        }
        if (crm.linkAudition(agencyId, auditionId) != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "AUDITION_NOT_FOUND");
        }
        org.audit(UUID.randomUUID(), "AUDITION_BRANCH_LINKED", actor.id(), agency.countryCode(), "AUDITION", auditionId.toString(), agencyId.toString());
    }

    public List<JdbcCrmStore.ActivityRow> activityLog(String rawCountry, UUID agencyId) {
        String code = CountryCodes.iso2(rawCountry);
        OrgAccess.Actor actor = access.requireCountry(code);
        UUID only = OrgRoles.countryStaff(actor.role()) ? actor.id() : null;
        if (only != null) {
            access.requireStaffPermission(actor, code, OrgRoles.PERM_CONSULT_LOG);
            if (agencyId != null) {
                access.requireAssignedAgency(actor, code, agencyId);
            }
        }
        return crm.activities(code, only, agencyId);
    }

    public List<AgencySelf> own() {
        OrgAccess.Actor actor = access.requireUser();
        if (!OrgRoles.agencyOperator(actor.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "AGENCY_ONLY");
        }
        return crm.findByLinkedUser(actor.id()).stream()
                .map(row -> new AgencySelf(row.id(), row.countryCode(), row.displayName(), row.stage(), row.approvalState()))
                .toList();
    }

    public List<JdbcCrmStore.ActivityCount> activities(String rawCountry) {
        String code = CountryCodes.iso2(rawCountry);
        OrgAccess.Actor actor = access.requireCountry(code);
        UUID only = OrgRoles.countryStaff(actor.role()) ? actor.id() : null;
        if (only != null) {
            access.requireStaffPermission(actor, code, OrgRoles.PERM_CONSULT_LOG);
        }
        return crm.activityCounts(code, only);
    }

    private AgencyRow requireVisible(UUID id) {
        AgencyRow row = crm.find(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "AGENCY_NOT_FOUND"));
        OrgAccess.Actor actor = access.requireCountry(row.countryCode());
        access.requireAssignedAgency(actor, row.countryCode(), id);
        return row;
    }

    public record AgencySelf(UUID id, String countryCode, String displayName, String stage, String approvalState) {
    }

    public record AgencyDraft(
            String countryCode,
            String displayName,
            String legalName,
            String businessRegistration,
            String contactName,
            String contactEmail,
            String contactPhone,
            String website,
            UUID assignedStaffUserId,
            UUID linkedUserId,
            String notes) {
    }
}
