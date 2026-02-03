package com.audition.platform.application.service;

import com.audition.platform.application.dto.AgencyBookmarkDto;
import com.audition.platform.application.dto.UpsertAgencyBookmarkRequest;
import com.audition.platform.domain.entity.AgencyBookmark;
import com.audition.platform.domain.repository.AgencyBookmarkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AgencyBookmarkService {

    private final AgencyBookmarkRepository agencyBookmarkRepository;
    private final UserRoleValidator userRoleValidator;

    public AgencyBookmarkDto upsertBookmark(Long ownerId, UpsertAgencyBookmarkRequest request) {
        userRoleValidator.requireAgencyMember(ownerId);

        AgencyBookmark bookmark = agencyBookmarkRepository
                .findByOwnerIdAndApplicantId(ownerId, request.getApplicantId())
                .orElseGet(() -> AgencyBookmark.builder()
                        .ownerId(ownerId)
                        .applicantId(request.getApplicantId())
                        .build());

        bookmark.setMemo(request.getMemo());
        AgencyBookmark saved = agencyBookmarkRepository.save(bookmark);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public Page<AgencyBookmarkDto> getMyBookmarks(Long ownerId, Pageable pageable) {
        userRoleValidator.requireAgencyMember(ownerId);
        return agencyBookmarkRepository.findByOwnerId(ownerId, pageable)
                .map(this::toDto);
    }

    public void deleteBookmark(Long ownerId, Long applicantId) {
        userRoleValidator.requireAgencyMember(ownerId);
        agencyBookmarkRepository.findByOwnerIdAndApplicantId(ownerId, applicantId)
                .ifPresent(agencyBookmarkRepository::delete);
    }

    private AgencyBookmarkDto toDto(AgencyBookmark bookmark) {
        return AgencyBookmarkDto.builder()
                .id(bookmark.getId())
                .ownerId(bookmark.getOwnerId())
                .applicantId(bookmark.getApplicantId())
                .memo(bookmark.getMemo())
                .createdAt(bookmark.getCreatedAt())
                .updatedAt(bookmark.getUpdatedAt())
                .build();
    }
}

