package com.audition.platform.application.vote;

import com.audition.platform.api.dto.AuditionPublicVotesDataDto;
import com.audition.platform.api.dto.PublicVoteItemDto;
import com.audition.platform.api.dto.VoteMutationResultDto;
import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.ApplicationVideo;
import com.audition.platform.domain.audition.ApplicationVideoRepository;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.channel.ChannelVideo;
import com.audition.platform.domain.channel.ChannelVideoRepository;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import com.audition.platform.domain.vote.Vote;
import com.audition.platform.domain.vote.VoteRepository;
import com.audition.platform.infra.SecurityUtils;
import com.audition.platform.infra.YoutubeThumbnailUtil;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PublicVoteService {

    /**
     * 공개 투표 카드 노출 대상 — 지원 심사 상태와 무관한 정책(불합격만 제외).
     * 투표 가능 여부는 {@link #castVote}에서 별도 검증.
     */
    private static final List<String> LISTABLE_STATUSES = List.of("SUBMITTED", "REVIEWING", "ACCEPTED");

    private final AuditionRepository auditionRepository;
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final ApplicationVideoRepository applicationVideoRepository;
    private final ChannelVideoRepository channelVideoRepository;
    private final VoteRepository voteRepository;

    public PublicVoteService(
            AuditionRepository auditionRepository,
            ApplicationRepository applicationRepository,
            UserRepository userRepository,
            ApplicationVideoRepository applicationVideoRepository,
            ChannelVideoRepository channelVideoRepository,
            VoteRepository voteRepository) {
        this.auditionRepository = auditionRepository;
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
        this.applicationVideoRepository = applicationVideoRepository;
        this.channelVideoRepository = channelVideoRepository;
        this.voteRepository = voteRepository;
    }

    public AuditionPublicVotesDataDto getPublicVotes(UUID auditionId) {
        Audition audition = auditionRepository.findById(auditionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "오디션을 찾을 수 없습니다."));
        assertAgencyMayViewVoteLeaderboard(audition);

        UUID voterId = SecurityUtils.getCurrentUserId();
        final String myVoteStr = voterId == null
                ? null
                : voteRepository.findByAuditionIdAndUserId(auditionId, voterId)
                        .map(v -> v.getApplicationId().toString())
                        .orElse(null);

        long totalVotes = applicationRepository.sumVoteCountByAuditionId(auditionId);

        List<Application> apps = applicationRepository.findByAuditionIdAndStatusInOrderByCreatedAtDesc(
                auditionId, LISTABLE_STATUSES);

        List<PublicVoteItemDto> items = apps.stream()
                .map(app -> toItem(app, myVoteStr))
                .collect(Collectors.toList());

        AuditionPublicVotesDataDto out = new AuditionPublicVotesDataDto();
        out.setTotalVotes(totalVotes);
        out.setMyVote(myVoteStr);
        out.setItems(items);
        return out;
    }

    /**
     * AGENCY는 본인 소유 오디션의 투표 현황만 조회 가능. ADMIN은 전체. APPLICANT/비로그인은 공개 조회.
     */
    private void assertAgencyMayViewVoteLeaderboard(Audition audition) {
        if (SecurityUtils.hasRole("ADMIN")) {
            return;
        }
        if (!SecurityUtils.hasRole("AGENCY")) {
            return;
        }
        UUID uid = SecurityUtils.getCurrentUserId();
        if (uid == null || !audition.getOwnerId().equals(uid)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "다른 기획사 공고의 투표 현황은 조회할 수 없습니다.");
        }
    }

    private PublicVoteItemDto toItem(Application app, String myVoteApplicationId) {
        User applicant = userRepository.findById(app.getApplicantId()).orElse(null);

        String videoUrl = "";
        Optional<ApplicationVideo> appVid = applicationVideoRepository.findFirstByApplicationIdOrderByCreatedAtAsc(app.getId());
        if (appVid.isPresent() && appVid.get().getVideoUrl() != null) {
            videoUrl = appVid.get().getVideoUrl();
        }

        Optional<ChannelVideo> chVid = channelVideoRepository.findFirstByOwnerIdOrderByUpdatedAtDesc(app.getApplicantId());
        String thumbnailUrl = null;
        long viewCount = 0;
        String category = "";
        if (chVid.isPresent()) {
            ChannelVideo cv = chVid.get();
            thumbnailUrl = cv.getThumbnailUrl();
            viewCount = cv.getViewCount();
            category = cv.getCategory() != null ? cv.getCategory() : "";
        }
        if (thumbnailUrl == null || thumbnailUrl.isBlank()) {
            thumbnailUrl = YoutubeThumbnailUtil.hqThumbnail(videoUrl).orElse(null);
        }

        String appIdStr = app.getId().toString();
        boolean isVoted = myVoteApplicationId != null && myVoteApplicationId.equals(appIdStr);

        PublicVoteItemDto dto = new PublicVoteItemDto();
        dto.setApplicationId(appIdStr);
        dto.setUserName(applicant != null ? applicant.getDisplayName() : "");
        dto.setDescription(applicant != null && applicant.getBio() != null ? applicant.getBio() : "");
        dto.setVideoUrl(videoUrl);
        dto.setThumbnailUrl(thumbnailUrl);
        dto.setCategory(category);
        dto.setVoteCount(app.getVoteCount());
        dto.setViewCount(viewCount);
        dto.setVoted(isVoted);
        return dto;
    }

    @Transactional
    public VoteMutationResultDto castVote(UUID applicationId) {
        assertApplicantMayVote();
        UUID voterId = requireUserId();

        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "지원을 찾을 수 없습니다."));
        if (!LISTABLE_STATUSES.contains(app.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "투표할 수 없는 지원 상태입니다.");
        }

        Audition audition = auditionRepository.findById(app.getAuditionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "오디션을 찾을 수 없습니다."));
        if (!"OPEN".equals(audition.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "모집 중인 오디션에서만 투표할 수 있습니다.");
        }

        Optional<Vote> previous = voteRepository.findByAuditionIdAndUserId(audition.getId(), voterId);
        if (previous.isPresent()) {
            Vote pv = previous.get();
            if (pv.getApplicationId().equals(app.getId())) {
                return new VoteMutationResultDto(app.getId().toString());
            }
            int dec = applicationRepository.adjustVoteCount(pv.getApplicationId(), -1);
            if (dec != 1) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "투표 수 동기화 오류가 발생했습니다. 다시 시도해주세요.");
            }
            voteRepository.delete(pv);
        }

        int inc = applicationRepository.adjustVoteCount(app.getId(), 1);
        if (inc != 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "투표 수 반영에 실패했습니다.");
        }

        Vote row = new Vote();
        row.setAuditionId(audition.getId());
        row.setApplicationId(app.getId());
        row.setUserId(voterId);
        voteRepository.save(row);

        return new VoteMutationResultDto(app.getId().toString());
    }

    @Transactional
    public void removeVote(UUID applicationId) {
        assertApplicantMayVote();
        UUID voterId = requireUserId();

        Vote vote = voteRepository.findByUserIdAndApplicationId(voterId, applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "해당 투표를 찾을 수 없습니다."));

        int dec = applicationRepository.adjustVoteCount(vote.getApplicationId(), -1);
        if (dec != 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "투표 취소 중 동기화 오류가 발생했습니다.");
        }
        voteRepository.delete(vote);
    }

    /** USER(역할 APPLICANT)만 투표/취소 — AGENCY/ADMIN은 투표 API 사용 불가 */
    private static void assertApplicantMayVote() {
        if (!SecurityUtils.hasRole("APPLICANT")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "투표는 일반 사용자(지원자) 계정만 가능합니다.");
        }
    }

    private static UUID requireUserId() {
        UUID id = SecurityUtils.getCurrentUserId();
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        return id;
    }
}
