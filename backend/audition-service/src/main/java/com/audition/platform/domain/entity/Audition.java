package com.audition.platform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "auditions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Audition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(name = "title_en")
    private String titleEn;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuditionStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuditionCategory category;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT", name = "requirements")
    private String requirements;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "screening_date_1")
    private LocalDate screeningDate1;

    @Column(name = "announcement_date_1")
    private LocalDate announcementDate1;

    @Column(name = "screening_date_2")
    private LocalDate screeningDate2;

    @Column(name = "announcement_date_2")
    private LocalDate announcementDate2;

    @Column(name = "screening_date_3")
    private LocalDate screeningDate3;

    @Column(name = "announcement_date_3")
    private LocalDate announcementDate3;

    @Column(name = "banner_url")
    private String bannerUrl;

    @Column(name = "poster_url", length = 500)
    private String posterUrl;

    @Column(name = "poster_key", length = 500)
    private String posterKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "video_type", length = 20)
    @Builder.Default
    private VideoType videoType = VideoType.YOUTUBE;

    @Column(name = "video_url", length = 500)
    private String videoUrl;

    @Column(name = "video_key", length = 500)
    private String videoKey;

    @Column(name = "max_rounds", nullable = false)
    @Builder.Default
    private Integer maxRounds = 1;

    @Column(name = "deadline_at")
    private LocalDateTime deadlineAt;

    @Column(name = "business_id", nullable = false)
    private Long businessId;

    @OneToMany(mappedBy = "audition", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Application> applications = new ArrayList<>();

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum AuditionStatus {
        ONGOING,
        UNDER_SCREENING,
        FINISHED,
        WAITING_OPENING,
        WRITING
    }

    public enum AuditionCategory {
        SINGER,
        DANCER,
        ACTOR,
        MODEL,
        INSTRUMENT
    }

    public enum VideoType {
        YOUTUBE,
        UPLOAD
    }
}
