package com.audition.platform.application.service;

import com.audition.platform.application.dto.ContentReportDto;
import com.audition.platform.application.dto.CreateContentReportRequest;
import com.audition.platform.domain.entity.ContentReport;
import com.audition.platform.domain.entity.User;
import com.audition.platform.domain.repository.ContentReportRepository;
import com.audition.platform.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 콘텐츠 관리 서비스
 * 작업: OPS_02_content_moderation
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ContentModerationService {

    private final ContentReportRepository contentReportRepository;
    private final UserRepository userRepository;

    /**
     * 신고 생성
     */
    public ContentReportDto createReport(Long reporterId, CreateContentReportRequest request) {
        // 중복 신고 방지 (같은 사용자가 같은 콘텐츠를 이미 신고한 경우)
        if (contentReportRepository.existsByReporterIdAndContentTypeAndContentId(
                reporterId, request.getContentType(), request.getContentId())) {
            throw new RuntimeException("이미 신고한 콘텐츠입니다");
        }

        ContentReport report = ContentReport.builder()
                .reporterId(reporterId)
                .contentType(request.getContentType())
                .contentId(request.getContentId())
                .reason(request.getReason())
                .description(request.getDescription())
                .status(ContentReport.ReportStatus.PENDING)
                .build();

        ContentReport saved = contentReportRepository.save(report);
        log.info("신고 생성: reportId={}, contentType={}, contentId={}, reporterId={}", 
                saved.getId(), request.getContentType(), request.getContentId(), reporterId);

        return toDto(saved);
    }

    /**
     * 신고 목록 조회 (관리자용)
     */
    @Transactional(readOnly = true)
    public Page<ContentReportDto> getReports(ContentReport.ReportStatus status, Pageable pageable) {
        Page<ContentReport> reports;
        if (status != null) {
            reports = contentReportRepository.findByStatus(status, pageable);
        } else {
            reports = contentReportRepository.findAll(pageable);
        }
        return reports.map(this::toDto);
    }

    /**
     * 내 신고 목록 조회
     */
    @Transactional(readOnly = true)
    public Page<ContentReportDto> getMyReports(Long reporterId, Pageable pageable) {
        Page<ContentReport> reports = contentReportRepository.findByReporterId(reporterId, pageable);
        return reports.map(this::toDto);
    }

    /**
     * 신고 검토 시작 (관리자)
     */
    public ContentReportDto startReview(Long reportId, Long reviewerId) {
        ContentReport report = contentReportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found: " + reportId));

        if (report.getStatus() != ContentReport.ReportStatus.PENDING) {
            throw new RuntimeException("대기 중인 신고만 검토할 수 있습니다");
        }

        report.setStatus(ContentReport.ReportStatus.REVIEWING);
        report.setReviewedBy(reviewerId);
        report.setReviewedAt(LocalDateTime.now());

        ContentReport saved = contentReportRepository.save(report);
        return toDto(saved);
    }

    /**
     * 신고 처리 완료 (관리자)
     */
    public ContentReportDto resolveReport(Long reportId, Long reviewerId, String resolution) {
        ContentReport report = contentReportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found: " + reportId));

        report.setStatus(ContentReport.ReportStatus.RESOLVED);
        report.setReviewedBy(reviewerId);
        report.setReviewedAt(LocalDateTime.now());
        report.setResolution(resolution);

        ContentReport saved = contentReportRepository.save(report);
        log.info("신고 처리 완료: reportId={}, reviewerId={}", reportId, reviewerId);
        return toDto(saved);
    }

    /**
     * 신고 기각 (관리자)
     */
    public ContentReportDto rejectReport(Long reportId, Long reviewerId, String reason) {
        ContentReport report = contentReportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found: " + reportId));

        report.setStatus(ContentReport.ReportStatus.REJECTED);
        report.setReviewedBy(reviewerId);
        report.setReviewedAt(LocalDateTime.now());
        report.setResolution(reason);

        ContentReport saved = contentReportRepository.save(report);
        log.info("신고 기각: reportId={}, reviewerId={}", reportId, reviewerId);
        return toDto(saved);
    }

    private ContentReportDto toDto(ContentReport report) {
        return ContentReportDto.builder()
                .id(report.getId())
                .reporterId(report.getReporterId())
                .contentType(report.getContentType())
                .contentId(report.getContentId())
                .reason(report.getReason())
                .description(report.getDescription())
                .status(report.getStatus())
                .reviewedBy(report.getReviewedBy())
                .reviewedAt(report.getReviewedAt())
                .resolution(report.getResolution())
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt())
                .build();
    }
}
