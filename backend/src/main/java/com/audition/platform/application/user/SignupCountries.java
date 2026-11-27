package com.audition.platform.application.user;

import com.audition.platform.application.i18n.ContentLocales;

import java.util.Currency;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;

/** Registration catalog. New countries do not acquire operating permissions or payment providers. */
public final class SignupCountries {
    private static final Set<String> ISO_CODES = Set.of(Locale.getISOCountries());
    private SignupCountries() {}

    public record Option(String code, String name, String englishName) {}

    public static List<Option> list(String language) {
        Locale display = Locale.forLanguageTag(language != null && ContentLocales.PRIMARY.contains(language) ? language : "en");
        return ISO_CODES.stream().filter(code -> currency(code) != null).sorted()
                .map(code -> {
                    Locale country = new Locale("", code);
                    return new Option(code, country.getDisplayCountry(display), country.getDisplayCountry(Locale.ENGLISH));
                }).toList();
    }

    public static void ensureRegistered(JdbcTemplate jdbc, String code) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM countries WHERE code = ?", Integer.class, code);
        if (count != null && count > 0) return;
        String currency = ISO_CODES.contains(code) ? currency(code) : null;
        if (currency == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "COUNTRY_NOT_FOUND");
        // An ISO catalog row is sufficient for residence and a PENDING agency application.
        // Never activate a country or create appointments, contracts, rates or provider settings here.
        jdbc.update("INSERT INTO countries (code, name, status, default_currency) VALUES (?, ?, 'INACTIVE', ?) ON CONFLICT (code) DO NOTHING",
                code, new Locale("", code).getDisplayCountry(Locale.ENGLISH), currency);
    }

    private static String currency(String code) {
        try {
            Currency currency = Currency.getInstance(new Locale("", code));
            return currency == null ? null : currency.getCurrencyCode();
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }
}
