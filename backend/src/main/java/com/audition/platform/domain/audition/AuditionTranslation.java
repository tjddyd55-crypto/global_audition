package com.audition.platform.domain.audition;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "audition_translations")
@IdClass(AuditionTranslationId.class)
public class AuditionTranslation {

    public static final String STATUS_COMPLETED = "COMPLETED";
    public static final String PROVIDER_MANUAL = "MANUAL";

    @Id
    @Column(name = "audition_id", nullable = false)
    private UUID auditionId;

    @Id
    @Column(nullable = false, length = 8)
    private String locale;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String title = "";

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description = "";

    @Column(nullable = false, columnDefinition = "TEXT")
    private String location = "";

    @Column(name = "agency_name", nullable = false, columnDefinition = "TEXT")
    private String agencyName = "";

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "recruit_fields", columnDefinition = "text[]")
    private String[] recruitFields = new String[0];

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(columnDefinition = "text[]")
    private String[] qualifications = new String[0];

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(columnDefinition = "text[]")
    private String[] schedules = new String[0];

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(columnDefinition = "text[]")
    private String[] benefits = new String[0];

    @Column(nullable = false)
    private String status = STATUS_COMPLETED;

    @Column(nullable = false)
    private String provider = PROVIDER_MANUAL;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public UUID getAuditionId() { return auditionId; }
    public void setAuditionId(UUID auditionId) { this.auditionId = auditionId; }
    public String getLocale() { return locale; }
    public void setLocale(String locale) { this.locale = locale; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getAgencyName() { return agencyName; }
    public void setAgencyName(String agencyName) { this.agencyName = agencyName; }
    public String[] getRecruitFields() { return recruitFields != null ? recruitFields : new String[0]; }
    public void setRecruitFields(String[] recruitFields) { this.recruitFields = recruitFields != null ? recruitFields : new String[0]; }
    public String[] getQualifications() { return qualifications != null ? qualifications : new String[0]; }
    public void setQualifications(String[] qualifications) { this.qualifications = qualifications != null ? qualifications : new String[0]; }
    public String[] getSchedules() { return schedules != null ? schedules : new String[0]; }
    public void setSchedules(String[] schedules) { this.schedules = schedules != null ? schedules : new String[0]; }
    public String[] getBenefits() { return benefits != null ? benefits : new String[0]; }
    public void setBenefits(String[] benefits) { this.benefits = benefits != null ? benefits : new String[0]; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
