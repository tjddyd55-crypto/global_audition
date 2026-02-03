package com.audition.platform.domain.repository;

import com.audition.platform.domain.entity.ColumnPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ColumnRepository extends JpaRepository<ColumnPost, Long> {
    Page<ColumnPost> findByStatus(ColumnPost.ColumnStatus status, Pageable pageable);
    
    // 작업: 2026_14_columns_content
    Page<ColumnPost> findByAuthorId(Long authorId, Pageable pageable);
}

