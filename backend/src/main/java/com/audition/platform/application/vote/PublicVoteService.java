package com.audition.platform.application.vote;

import com.audition.platform.api.dto.CategoryCountDto;
import com.audition.platform.api.dto.PublicVoteItemDto;
import com.audition.platform.api.dto.PublicVotePageDataDto;
import com.audition.platform.api.dto.VoteMutationResultDto;
import com.audition.platform.api.dto.VotePageAuditionDto;
import com.audition.platform.api.dto.VotePageSummaryDto;
import com.audition.platform.application.audition.ApplicantCardMetricsLoader;
import com.audition.platform.application.me.MeApiMapping;
import com.audition.platform.application.ranking.ApplicationRankingService;
import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.score.ApplicationScore;
import com.audition.platform.domain.score.ApplicationScoreRepository;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import com.audition.platform.domain.vote.Vote;
import com.audition.platform.domain.vote.VoteRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class PublicVoteService {

    private static final List<String> LISTABLE_STATUSES = List.of("SUBMITTED", "REVIEWING", "ACCEPTED");
    private static final List<String> STANDARD_CATEGORIES = List.of("보컬", "댄스", "랩", "프로듀싱");

    private final AuditionRepository auditionRepository;
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final ApplicantCardMetricsLoader metricsLoader;
    private final VoteRepository voteRepository;
    private final ApplicationScoreRepository applicationScoreRepository;
    private final ApplicationRankingService applicationRankingService;

    public PublicVoteService(
            AuditionRepository auditionRepository,
            ApplicationRepository applicationRepository,
            UserRepository userRepository,
            ApplicantCardMetricsLoader metricsLoader,
            VoteRepository voteRepository,
            ApplicationScoreRepository applicationScoreRepository,
            ApplicationRankingService applicationRankingService) {
        this.auditionRepository = auditionRepository;
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
        this.metricsLoader = metricsLoader;
        this.voteRepository = voteRepository;
        this.applicationScoreRepository = applicationScoreRepository;
        this.applicationRankingService = applicationRankingService;
    }

    public PublicVotePageDataDto getPublicVotes(UUID auditionId, String categoryFilter) {
        Audition audition = auditionRepository.findById(auditionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "오디션을 찾을 수 없습니다."));

        List<Application> apps = applicationRepository.findByAuditionIdAndStatusInOrderByCreatedAtDesc(
                auditionId, LISTABLE_STATUSES);

        ensureScoresIfMissing(auditionId, apps);

        Map<UUID, ApplicationScore> scoreByApp = applicationScoreRepository.findByAuditionId(auditionId).stream()
                .collect(Collectors.toMap(ApplicationScore::getApplicationId, Function.identity(), (a, b) -> a));

        UUID voterId = SecurityUtils.getCurrentUserId();
        final String myVoteStr = voterId == null
                ? null
                : voteRepository.findByAuditionIdAndUserId(auditionId, voterId)
                        .map(v -> v.getApplicationId().toString())
                        .orElse(null);

        long totalVotes = applicationRepository.sumVoteCountByAuditionId(auditionId);

        List<PublicVoteItemDto> allItems = apps.stream()
                .map(app -> toVoteItem(app, myVoteStr, scoreByApp.get(app.getId())))
                .collect(Collectors.toList());

        List<PublicVoteItemDto> visible = filterByCategory(allItems, categoryFilter);

        long totalViews = allItems.stream().mapToLong(PublicVoteItemDto::getViewCount).sum();
        int myVoteCount = myVoteStr != null && !myVoteStr.isBlank() ? 1 : 0;

        VotePageSummaryDto summary = new VotePageSummaryDto();
        summary.setApplicantCount(allItems.size());
        summary.setTotalVotes(totalVotes);
        summary.setTotalViewCount(totalViews);
        summary.setMyVoteCount(myVoteCount);

        VotePageAuditionDto auditionDto = new VotePageAuditionDto();
        auditionDto.setId(audition.getId().toString());
        auditionDto.setTitle(audition.getTitle() != null ? audition.getTitle() : "");
        auditionDto.setDescription(audition.getDescription() != null ? audition.getDescription() : "");
        auditionDto.setApplicantCount(allItems.size());
        auditionDto.setTotalVotes(totalVotes);
        auditionDto.setCategories(buildCategoryTabs(allItems));

        PublicVotePageDataDto out = new PublicVotePageDataDto();
        out.setAudition(auditionDto);
        out.setSummary(summary);
        out.setMyVoteApplicationId(myVoteStr);
        out.setItems(visible);
        return out;
    }

    private void ensureScoresIfMissing(UUID auditionId, List<Application> listableApps) {
        if (listableApps.isEmpty()) {
            return;
        }
        if (applicationScoreRepository.countByAuditionId(auditionId) == 0) {
            applicationRankingService.recalculateScores(auditionId);
        }
    }

    private static List<PublicVoteItemDto> filterByCategory(List<PublicVoteItemDto> items, String categoryFilter) {
        if (!StringUtils.hasText(categoryFilter) || "전체".equals(categoryFilter.trim())) {
            return items;
        }
        String want = categoryFilter.trim();
        return items.stream()
                .filter(i -> want.equals((i.getCategory() != null ? i.getCategory() : "").trim()))
                .collect(Collectors.toList());
    }

    private List<CategoryCountDto> buildCategoryTabs(List<PublicVoteItemDto> items) {
        List<CategoryCountDto> tabs = new ArrayList<>();
        tabs.add(new CategoryCountDto("전체", items.size()));
        for (String c : STANDARD_CATEGORIES) {
            long n = items.stream()
                    .filter(i -> c.equals((i.getCategory() != null ? i.getCategory() : "").trim()))
                    .count();
            tabs.add(new CategoryCountDto(c, n));
        }
        return tabs;
    }

    private PublicVoteItemDto toVoteItem(Application app, String myVoteApplicationId, ApplicationScore score) {
        User applicant = userRepository.findById(app.getApplicantId()).orElse(null);
        var m = metricsLoader.resolve(app);

        String appIdStr = app.getId().toString();
        boolean isVoted = myVoteApplicationId != null && myVoteApplicationId.equals(appIdStr);
        int rank = score != null && score.getRecommendedRank() != null ? score.getRecommendedRank() : 0;

        PublicVoteItemDto dto = new PublicVoteItemDto();
        dto.setApplicationId(appIdStr);
        dto.setUserName(applicant != null ? applicant.getPublicDisplayLabel() : "");
        dto.setUserEmail(applicant != null ? applicant.getEmail() : "");
        dto.setDescription(applicant != null && applicant.getBio() != null ? applicant.getBio() : "");
        dto.setVideoUrl(m.videoUrl());
        dto.setThumbnailUrl(m.thumbnailUrl());
        dto.setCategory(m.category());
        dto.setVoteCount(app.getVoteCount());
        dto.setViewCount(m.viewCount());
        dto.setVoted(isVoted);
        dto.setRank(rank);
        dto.setStatus(MeApiMapping.applicationStatusToApi(app.getStatus()));
        if (score != null) {
            dto.setRecommendedScore(score.getWeightedScore());
            dto.setRecommendedRank(score.getRecommendedRank());
            dto.setRecommended(score.isRecommended());
        } else {
            dto.setRecommendedScore(0.0);
            dto.setRecommendedRank(0);
            dto.setRecommended(false);
        }
        return dto;
    }

    @Transactional
    public VoteMutationResultDto castVote(UUID auditionId, UUID applicationId) {
        assertAuthenticatedMayVote();
        UUID voterId = requireUserId();

        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "지원을 찾을 수 없습니다."));
        if (!app.getAuditionId().equals(auditionId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "오디션과 지원이 일치하지 않습니다.");
        }
        if (!LISTABLE_STATUSES.contains(app.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "투표할 수 없는 지원 상태입니다.");
        }

        Audition audition = auditionRepository.findById(app.getAuditionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "오디션을 찾을 수 없습니다."));
        if (!"OPEN".equals(audition.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "모집 중인 오디션에서만 투표할 수 있습니다.");
        }

        Optional<Vote> previous = voteRepository.findByAuditionIdAndUserId(audition.getId(), voterId);
        boolean replaced = false;
        if (previous.isPresent()) {
            Vote pv = previous.get();
            if (pv.getApplicationId().equals(app.getId())) {
                return new VoteMutationResultDto(app.getId().toString(), false);
            }
            replaced = true;
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

        applicationRankingService.recalculateScores(auditionId);
        return new VoteMutationResultDto(app.getId().toString(), replaced);
    }

    @Transactional
    public void removeVote(UUID applicationId) {
        assertAuthenticatedMayVote();
        UUID voterId = requireUserId();

        Vote vote = voteRepository.findByUserIdAndApplicationId(voterId, applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "해당 투표를 찾을 수 없습니다."));

        UUID auditionId = vote.getAuditionId();

        int dec = applicationRepository.adjustVoteCount(vote.getApplicationId(), -1);
        if (dec != 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "투표 취소 중 동기화 오류가 발생했습니다.");
        }
        voteRepository.delete(vote);

        applicationRankingService.recalculateScores(auditionId);
    }

    /** MVP: 로그인한 사용자는 투표 가능 (역할은 백엔드에서만 판단, 프론트 추정 금지). */
    private static void assertAuthenticatedMayVote() {
        if (SecurityUtils.getCurrentUserId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
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
