package com.audition.platform.domain.repository;

import com.audition.platform.domain.entity.ContentReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 콘텐츠 신고 Repository
 * 작업: OPS_02_content_moderation
 */
@Repository
public interface ContentReportRepository extends JpaRepository<ContentReport, Long> {
    
    Page<ContentReport> findByStatus(ContentReport.ReportStatus status, Pageable pageable);
    
    Page<ContentReport> findByContentTypeAndContentId(
            ContentReport.ContentType contentType, Long contentId, Pageable pageable);
    
    Page<ContentReport> findByReporterId(Long reporterId, Pageable pageable);
    
    boolean existsByReporterIdAndContentTypeAndContentId(
            Long reporterId, ContentReport.ContentType contentType, Long contentId);
}
