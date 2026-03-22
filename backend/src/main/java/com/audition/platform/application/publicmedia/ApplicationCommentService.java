package com.audition.platform.application.publicmedia;

import com.audition.platform.api.dto.ApplicationCommentDto;
import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.comment.ApplicationComment;
import com.audition.platform.domain.comment.ApplicationCommentRepository;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ApplicationCommentService {

    private static final List<String> LISTABLE_STATUSES = List.of("SUBMITTED", "REVIEWING", "ACCEPTED");

    private final ApplicationRepository applicationRepository;
    private final ApplicationCommentRepository applicationCommentRepository;
    private final UserRepository userRepository;

    public ApplicationCommentService(
            ApplicationRepository applicationRepository,
            ApplicationCommentRepository applicationCommentRepository,
            UserRepository userRepository) {
        this.applicationRepository = applicationRepository;
        this.applicationCommentRepository = applicationCommentRepository;
        this.userRepository = userRepository;
    }

    public List<ApplicationCommentDto> listByApplication(UUID applicationId) {
        assertListable(applicationId);
        return applicationCommentRepository.findByApplicationIdOrderByCreatedAtAsc(applicationId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ApplicationCommentDto create(UUID userId, UUID applicationId, String rawContent) {
        assertListable(applicationId);
        String content = rawContent != null ? rawContent.trim() : "";
        if (!StringUtils.hasText(content)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "댓글 내용이 비어 있습니다.");
        }
        ApplicationComment row = new ApplicationComment();
        row.setApplicationId(applicationId);
        row.setUserId(userId);
        row.setBody(content);
        applicationCommentRepository.save(row);
        return toDto(row);
    }

    private void assertListable(UUID applicationId) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "지원을 찾을 수 없습니다."));
        if (!LISTABLE_STATUSES.contains(app.getStatus())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "공개되지 않은 지원입니다.");
        }
    }

    private ApplicationCommentDto toDto(ApplicationComment c) {
        User author = userRepository.findById(c.getUserId()).orElse(null);
        ApplicationCommentDto dto = new ApplicationCommentDto();
        dto.setId(c.getId().toString());
        dto.setAuthorDisplayName(author != null ? author.getDisplayName() : "");
        dto.setAuthorProfileImageUrl(author != null ? author.getProfileImageUrl() : null);
        dto.setContent(c.getBody());
        dto.setCreatedAt(c.getCreatedAt());
        return dto;
    }
}
