package com.audition.platform.domain.audition;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class AuditionTranslationId implements Serializable {

    private UUID auditionId;
    private String locale;

    public AuditionTranslationId() {
    }

    public AuditionTranslationId(UUID auditionId, String locale) {
        this.auditionId = auditionId;
        this.locale = locale;
    }

    public UUID getAuditionId() { return auditionId; }
    public void setAuditionId(UUID auditionId) { this.auditionId = auditionId; }
    public String getLocale() { return locale; }
    public void setLocale(String locale) { this.locale = locale; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof AuditionTranslationId that)) return false;
        return Objects.equals(auditionId, that.auditionId) && Objects.equals(locale, that.locale);
    }

    @Override
    public int hashCode() {
        return Objects.hash(auditionId, locale);
    }
}
