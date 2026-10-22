package com.audition.platform.api;

import com.audition.platform.application.org.CountryOrgService;
import com.audition.platform.application.org.JdbcOrgStore.AppointmentRow;
import com.audition.platform.application.org.JdbcOrgStore.CountryRow;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/org/countries")
public class CountryOrgController {

    private final CountryOrgService countries;

    public CountryOrgController(CountryOrgService countries) {
        this.countries = countries;
    }

    @GetMapping
    public List<CountryRow> list() {
        return countries.listCountries();
    }

    @PostMapping
    public CountryRow create(@RequestBody CountryCreateRequest request) {
        return countries.createCountry(request.code(), request.name(), request.defaultCurrency());
    }

    @PostMapping("/{code}/representative")
    public void appoint(@PathVariable String code, @RequestBody AppointRequest request) {
        countries.appointRepresentative(code, request.userId(), request.reason());
    }

    @GetMapping("/{code}/representatives")
    public List<AppointmentRow> history(@PathVariable String code) {
        return countries.history(code);
    }

    @PostMapping("/{code}/staff")
    public void staff(@PathVariable String code, @RequestBody StaffRequest request) {
        countries.addStaff(code, request.userId(), request.permissions());
    }

    public record CountryCreateRequest(String code, String name, String defaultCurrency) {
    }

    public record AppointRequest(UUID userId, String reason) {
    }

    public record StaffRequest(UUID userId, List<String> permissions) {
    }
}
