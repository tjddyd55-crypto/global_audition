package com.audition.platform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "applications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audition_id", nullable = false)
    private Audition audition;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus status;

    @Enumerated(EnumType.STRING)
    private ScreeningResult result1;

    @Enumerated(EnumType.STRING)
    private ScreeningResult result2;

    @Enumerated(EnumType.STRING)
    private ScreeningResult result3;

    @Enumerated(EnumType.STRING)
    @Column(name = "final_result")
    private ScreeningResult finalResult;

    @Column(name = "video_id_1")
    private Long videoId1;

    @Column(name = "video_id_2")
    private Long videoId2;

    @ElementCollection
    @CollectionTable(name = "application_photos", joinColumns = @JoinColumn(name = "application_id"))
    @Column(name = "photo_url")
    @Builder.Default
    private List<String> photos = new ArrayList<>();

    @Column(name = "payment_transaction_id")
    private String paymentTransactionId;

    @Column(name = "payment_amount")
    private Double paymentAmount;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum ApplicationStatus {
        WRITING,
        INCOMPLETE_PAYMENT,
        APPLICATION_COMPLETED,
        CANCEL
    }

    public enum ScreeningResult {
        PASS,
        FAIL,
        PENDING
    }
}
