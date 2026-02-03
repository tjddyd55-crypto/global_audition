package com.audition.platform.application.service;

import com.audition.platform.application.dto.ColumnDto;
import com.audition.platform.application.dto.CreateColumnRequest;
import com.audition.platform.domain.entity.ColumnPost;
import com.audition.platform.domain.entity.User;
import com.audition.platform.domain.repository.ColumnRepository;
import com.audition.platform.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ColumnService {

    private final ColumnRepository columnRepository;
    private final UserRepository userRepository;

    /**
     * 공개 칼럼 목록 조회
     * 작업: 2026_14_columns_content
     */
    @Transactional(readOnly = true)
    public Page<ColumnDto> getPublishedColumns(Pageable pageable) {
        return columnRepository.findByStatus(ColumnPost.ColumnStatus.PUBLISHED, pageable)
                .map(this::toDto);
    }

    /**
     * 내 칼럼 목록 조회
     * 작업: 2026_14_columns_content
     */
    @Transactional(readOnly = true)
    public Page<ColumnDto> getMyColumns(Long authorId, Pageable pageable) {
        return columnRepository.findByAuthorId(authorId, pageable)
                .map(this::toDto);
    }

    /**
     * 칼럼 상세 조회
     * 작업: 2026_14_columns_content
     */
    @Transactional(readOnly = true)
    public ColumnDto getColumn(Long columnId, Long requesterId) {
        ColumnPost column = columnRepository.findById(columnId)
                .orElseThrow(() -> new RuntimeException("Column not found: " + columnId));

        // 초안은 작성자만 조회 가능
        if (column.getStatus() == ColumnPost.ColumnStatus.DRAFT) {
            if (requesterId == null || !column.getAuthorId().equals(requesterId)) {
                throw new RuntimeException("초안 칼럼은 작성자만 조회할 수 있습니다");
            }
        }

        return toDto(column);
    }

    /**
     * 칼럼 생성
     * 작업: 2026_14_columns_content - 기획사/트레이너(관리자) 칼럼 발행
     */
    public ColumnDto createColumn(Long authorId, CreateColumnRequest request) {
        // 기획사 또는 관리자(트레이너)만 칼럼 작성 가능
        validateColumnAuthor(authorId);

        ColumnPost column = ColumnPost.builder()
                .authorId(authorId)
                .title(request.getTitle())
                .content(request.getContent())
                .status(ColumnPost.ColumnStatus.DRAFT)
                .build();

        ColumnPost saved = columnRepository.save(column);
        return toDto(saved);
    }

    /**
     * 칼럼 발행
     * 작업: 2026_14_columns_content
     */
    public ColumnDto publishColumn(Long authorId, Long columnId) {
        // 기획사 또는 관리자(트레이너)만 칼럼 발행 가능
        validateColumnAuthor(authorId);

        ColumnPost column = columnRepository.findById(columnId)
                .orElseThrow(() -> new RuntimeException("Column not found: " + columnId));
        
        // 작성자 확인
        if (!column.getAuthorId().equals(authorId)) {
            throw new RuntimeException("칼럼 작성자만 발행할 수 있습니다");
        }
        
        column.setStatus(ColumnPost.ColumnStatus.PUBLISHED);
        ColumnPost saved = columnRepository.save(column);
        return toDto(saved);
    }

    /**
     * 칼럼 작성자 권한 검증 (기획사 또는 관리자)
     * 작업: 2026_14_columns_content
     */
    private void validateColumnAuthor(Long authorId) {
        if (authorId == null) {
            throw new RuntimeException("인증이 필요합니다");
        }
        User user = userRepository.findById(authorId)
                .orElseThrow(() -> new RuntimeException("User not found: " + authorId));
        
        if (user.getUserType() != User.UserType.BUSINESS && user.getUserType() != User.UserType.ADMIN) {
            throw new RuntimeException("기획사 또는 관리자(트레이너)만 칼럼을 작성할 수 있습니다");
        }
    }

    private ColumnDto toDto(ColumnPost column) {
        return ColumnDto.builder()
                .id(column.getId())
                .authorId(column.getAuthorId())
                .title(column.getTitle())
                .content(column.getContent())
                .status(column.getStatus())
                .createdAt(column.getCreatedAt())
                .updatedAt(column.getUpdatedAt())
                .build();
    }
}

