package com.audition.platform.application.org;

import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

/**
 * 메뉴 숨김과 별개로 API마다 역할과 국가 범위를 검사한다.
 */
@Component
public class OrgAccess {

    private final OrgDirectory directory;

    public OrgAccess(OrgDirectory directory) {
        this.directory = directory;
    }

    public Actor requireUser() {
        UUID id = SecurityUtils.getCurrentUserId();
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        String role = directory.roleOf(id);
        if (role == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        return new Actor(id, role);
    }

    public Actor requireHq() {
        Actor actor = requireUser();
        if (!OrgRoles.hq(actor.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "HQ_ONLY");
        }
        return actor;
    }

    public Actor requireCountry(String countryCode) {
        Actor actor = requireUser();
        String code = CountryCodes.iso2(countryCode);
        if (OrgRoles.hq(actor.role())) {
            return actor;
        }
        if (OrgRoles.countryAdmin(actor.role()) && code.equals(directory.activeRepCountry(actor.id()))) {
            return actor;
        }
        if (OrgRoles.countryStaff(actor.role()) && code.equals(directory.activeStaffCountry(actor.id()))) {
            return actor;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "COUNTRY_SCOPE_DENIED");
    }

    public void requireStaffPermission(Actor actor, String countryCode, String permission) {
        if (OrgRoles.hq(actor.role()) || OrgRoles.countryAdmin(actor.role())) {
            return;
        }
        if (!directory.staffHas(actor.id(), CountryCodes.iso2(countryCode), permission)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "STAFF_PERMISSION_DENIED");
        }
    }

    public void requireAssignedAgency(Actor actor, String countryCode, UUID crmAgencyId) {
        if (OrgRoles.hq(actor.role()) || OrgRoles.countryAdmin(actor.role())) {
            return;
        }
        if (!directory.staffAssigned(actor.id(), CountryCodes.iso2(countryCode), crmAgencyId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "AGENCY_NOT_ASSIGNED");
        }
    }

    public record Actor(UUID id, String role) {
    }
}
