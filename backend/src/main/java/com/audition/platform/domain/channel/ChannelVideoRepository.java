package com.audition.platform.domain.channel;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChannelVideoRepository extends JpaRepository<ChannelVideo, UUID> {

    List<ChannelVideo> findByChannelIdOrderByCreatedAtDesc(UUID channelId);

    List<ChannelVideo> findByChannelIdAndVisibilityOrderByCreatedAtDesc(UUID channelId, String visibility);

    /** 소유자·공개 여부별 목록 (채널 공개 페이지용). */
    List<ChannelVideo> findByOwnerIdAndVisibilityOrderByCreatedAtDesc(UUID ownerId, String visibility);

    Optional<ChannelVideo> findFirstByOwnerIdOrderByUpdatedAtDesc(UUID ownerId);

    long countByOwnerId(UUID ownerId);

    @Query("SELECT COALESCE(SUM(v.viewCount), 0) FROM ChannelVideo v WHERE v.channelId = :channelId")
    long sumViewCountByChannelId(@Param("channelId") UUID channelId);

    Optional<ChannelVideo> findByIdAndOwnerId(UUID id, UUID ownerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT v FROM ChannelVideo v WHERE v.id = :id")
    Optional<ChannelVideo> lockByIdForUpdate(@Param("id") UUID id);

    @Query("""
            SELECT v FROM ChannelVideo v
            JOIN User u ON u.id = v.ownerId
            WHERE v.visibility = 'PUBLIC'
              AND u.channelPublic = true
              AND (u.role = 'APPLICANT' OR u.role = 'ADMIN')
              AND v.category IS NOT NULL
              AND TRIM(v.category) <> ''
              AND v.category = :category
              AND v.id <> :excludeId
            ORDER BY v.viewCount DESC, v.createdAt DESC
            """)
    List<ChannelVideo> findPublicRecommendations(
            @Param("category") String category,
            @Param("excludeId") UUID excludeId,
            Pageable pageable);

    @Query("""
            SELECT v FROM ChannelVideo v
            JOIN User u ON u.id = v.ownerId
            WHERE v.visibility = 'PUBLIC'
              AND u.channelPublic = true
              AND (u.role = 'APPLICANT' OR u.role = 'ADMIN')
              AND u.accountStatus = 'ACTIVE'
              AND (:category IS NULL OR :category = '' OR v.category = :category)
            ORDER BY v.createdAt DESC
            """)
    List<ChannelVideo> findPublicBrowseVideos(
            @Param("category") String category,
            Pageable pageable);

    long countByOwnerIdAndVisibility(UUID ownerId, String visibility);

    /**
     * 채널 공개 사용자 중, 공개(PUBLIC) 영상이 1개 이상 있는 소유자 ID (중복 제거).
     */
    @Query("""
            SELECT DISTINCT v.ownerId FROM ChannelVideo v, User u
            WHERE v.ownerId = u.id
              AND v.visibility = :visibility
              AND u.channelPublic = true
              AND (u.role = 'APPLICANT' OR u.role = 'ADMIN')
              AND u.accountStatus = 'ACTIVE'
            """)
    List<UUID> findDistinctOwnerIdsForPublicChannelListing(@Param("visibility") String visibility);
}
