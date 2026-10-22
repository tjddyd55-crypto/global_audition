package com.audition.platform.application.org;

import com.audition.platform.application.org.JdbcOrgStore.AppointmentRow;
import com.audition.platform.application.org.JdbcOrgStore.CountryRow;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class CountryOrgService {

    private final JdbcOrgStore store;
    private final OrgAccess access;

    public CountryOrgService(JdbcOrgStore store, OrgAccess access) {
        this.store = store;
        this.access = access;
    }

    @Transactional
    public CountryRow createCountry(String rawCode, String name, String rawCurrency) {
        access.requireHq();
        String code = CountryCodes.iso2(rawCode);
        String currency = CountryCodes.currency(rawCurrency);
        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "COUNTRY_NAME_REQUIRED");
        }
        if (store.countryExists(code)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "COUNTRY_EXISTS");
        }
        store.insertCountry(code, name.trim(), "ACTIVE", currency);
        OrgAccess.Actor actor = access.requireHq();
        store.audit(UUID.randomUUID(), "COUNTRY_CREATED", actor.id(), code, "COUNTRY", code, currency);
        return store.listCountries().stream().filter(row -> row.code().equals(code)).findFirst().orElseThrow();
    }

    public List<CountryRow> listCountries() {
        OrgAccess.Actor actor = access.requireUser();
        if (OrgRoles.hq(actor.role())) {
            return store.listCountries();
        }
        String code = OrgRoles.countryAdmin(actor.role())
                ? store.activeRepCountry(actor.id())
                : store.activeStaffCountry(actor.id());
        if (code == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "COUNTRY_SCOPE_DENIED");
        }
        return store.listCountries().stream().filter(row -> row.code().equals(code)).toList();
    }

    @Transactional
    public void appointRepresentative(String rawCode, UUID userId, String reason) {
        OrgAccess.Actor actor = access.requireHq();
        String code = requireCountry(rawCode);
        if (store.roleOf(userId) == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND");
        }
        Instant now = Instant.now();
        UUID nextId = UUID.randomUUID();
        store.activeAppointmentId(code).ifPresent(current -> {
            UUID previousUser = store.appointmentHistory(code).stream()
                    .filter(row -> row.id().equals(current))
                    .map(AppointmentRow::userId)
                    .findFirst()
                    .orElse(null);
            store.endAppointment(current, now, reason == null ? "REPLACED" : reason, nextId);
            releaseRepRole(previousUser);
            store.audit(UUID.randomUUID(), "COUNTRY_ADMIN_REPLACED", actor.id(), code, "APPOINTMENT", current.toString(), reason);
        });
        try {
            store.insertAppointment(nextId, code, userId, actor.id(), now);
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "ACTIVE_REP_EXISTS");
        }
        if (!OrgRoles.hq(store.roleOf(userId))) {
            store.setRoleIfNotHq(userId, OrgRoles.COUNTRY_ADMIN);
        }
        store.audit(UUID.randomUUID(), "COUNTRY_ADMIN_APPOINTED", actor.id(), code, "APPOINTMENT", nextId.toString(), null);
    }

    public List<AppointmentRow> history(String rawCode) {
        String code = CountryCodes.iso2(rawCode);
        access.requireCountry(code);
        return store.appointmentHistory(code);
    }

    @Transactional
    public void addStaff(String rawCode, UUID userId, List<String> permissions) {
        OrgAccess.Actor actor = access.requireCountry(rawCode);
        if (OrgRoles.countryStaff(actor.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "STAFF_CANNOT_APPOINT");
        }
        String code = requireCountry(rawCode);
        if (store.roleOf(userId) == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND");
        }
        if (store.activeStaffAssignment(code, userId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "STAFF_EXISTS");
        }
        UUID assignmentId = UUID.randomUUID();
        store.insertStaff(assignmentId, code, userId, actor.id(), Instant.now());
        if (!OrgRoles.hq(store.roleOf(userId))) {
            store.setRoleIfNotHq(userId, OrgRoles.COUNTRY_STAFF);
        }
        for (String permission : permissions == null ? List.<String>of() : permissions) {
            grant(actor, assignmentId, permission);
        }
        store.audit(UUID.randomUUID(), "COUNTRY_STAFF_ADDED", actor.id(), code, "STAFF", assignmentId.toString(), null);
    }

    private void grant(OrgAccess.Actor actor, UUID assignmentId, String permission) {
        if (permission == null || permission.isBlank()) {
            return;
        }
        String code = permission.trim();
        boolean grantable = store.permissionGrantable(code);
        if (!grantable && !OrgRoles.hq(actor.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "PERMISSION_NOT_GRANTABLE");
        }
        if (!grantable && OrgRoles.hq(actor.role())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PERMISSION_NOT_FOR_STAFF");
        }
        if (!grantable) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "PERMISSION_NOT_GRANTABLE");
        }
        store.grantPermission(assignmentId, code);
    }

    private String requireCountry(String rawCode) {
        String code = CountryCodes.iso2(rawCode);
        if (!store.countryExists(code)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "COUNTRY_NOT_FOUND");
        }
        return code;
    }

    private void releaseRepRole(UUID userId) {
        if (userId == null) {
            return;
        }
        if (store.activeAppointmentCount(userId) > 0) {
            return;
        }
        String role = store.roleOf(userId);
        if (OrgRoles.COUNTRY_ADMIN.equals(role)) {
            store.setRoleIfNotHq(userId, "USER");
        }
    }
}
