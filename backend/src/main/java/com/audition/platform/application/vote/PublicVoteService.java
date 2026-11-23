package com.audition.platform.application.vote;

import com.audition.platform.application.round.ReasonCode;

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
import com.audition.platform.domain.vote.AuditionVoteCandidate;
import com.audition.platform.domain.vote.AuditionVoteCandidateRepository;
import com.audition.platform.domain.vote.Vote;
import com.audition.platform.domain.vote.VoteRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
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
    private final AuditionVoteCandidateRepository voteCandidates;

    public PublicVoteService(
            AuditionRepository auditionRepository,
            ApplicationRepository applicationRepository,
            UserRepository userRepository,
            ApplicantCardMetricsLoader metricsLoader,
            VoteRepository voteRepository,
            ApplicationScoreRepository applicationScoreRepository,
            ApplicationRankingService applicationRankingService,
            AuditionVoteCandidateRepository voteCandidates) {
        this.auditionRepository = auditionRepository;
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
        this.metricsLoader = metricsLoader;
        this.voteRepository = voteRepository;
        this.applicationScoreRepository = applicationScoreRepository;
        this.applicationRankingService = applicationRankingService;
        this.voteCandidates = voteCandidates;
    }

    public PublicVotePageDataDto getPublicVotes(UUID auditionId, String categoryFilter) {
        return getPublicVotes(auditionId, categoryFilter, null, null);
    }

    /**
     * 공유 링크용: {@code requestedRound} 는 링크에 고정된 회차, {@code sharedCandidate} 는 링크의 후보 지원 ID.
     * 후보는 그 회차 확정 명단에 있을 때만 맨 위에 보여 준다(표시 순서만, 순위·득표는 그대로).
     * 지난 회차 링크는 종료로 보고, 아직 없는 회차 링크는 시작 전으로 본다(다음 회차로 바꿔 읽지 않는다).
     */
    public PublicVotePageDataDto getPublicVotes(UUID auditionId, String categoryFilter,
                                                Integer requestedRound, UUID sharedCandidate) {
        Audition audition = auditionRepository.findById(auditionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "오디션을 찾을 수 없습니다."));
        if ("DRAFT".equals(audition.getStatus())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "오디션을 찾을 수 없습니다.");
        }
        Instant now = Instant.now();
        int currentRound = audition.getVoteRoundNumber() != null
                ? audition.getVoteRoundNumber()
                : VotingRoundPlan.activeRound(audition);
        int round = requestedRound != null && requestedRound > 0 ? requestedRound : currentRound;
        VoteWindow.Phase phase;
        if (round == currentRound) {
            phase = VoteWindow.phase(audition, now);
        } else if (audition.getVoteRoundNumber() != null && round < currentRound
                && voteCandidates.countByAuditionIdAndRoundNumber(auditionId, round) > 0) {
            phase = VoteWindow.Phase.CLOSED;
        } else {
            phase = VoteWindow.Phase.NOT_STARTED;
        }
        boolean planEnabled = VotingRoundPlan.enabledFor(audition.getVotingRounds(), round);
        // 공개 투표는 기획사가 시작을 누르고, 시작·종료 시각 안에 있을 때만 받는다.
        boolean votingEnabled = planEnabled && phase == VoteWindow.Phase.OPEN;
        boolean showItems = planEnabled && (phase == VoteWindow.Phase.OPEN || phase == VoteWindow.Phase.CLOSED);

        List<Application> apps = !showItems ? List.<Application>of() : loadVoteApplications(audition, round, phase);
        Application shared = null;
        if (sharedCandidate != null && planEnabled && VoteWindow.hasStarted(phase)
                && voteCandidates.existsByAuditionIdAndRoundNumberAndApplicationId(auditionId, round, sharedCandidate)) {
            shared = applicationRepository.findById(sharedCandidate).orElse(null);
        }
        // 득표는 현재 회차 기준(회차마다 새로 받는다). applications.vote_count 는 전 회차 누계로 남는다.
        Map<UUID, Long> roundVotes = votingEnabled ? roundVoteCounts(auditionId, round) : Map.of();

        ensureScoresIfMissing(auditionId, apps);

        Map<UUID, ApplicationScore> scoreByApp = applicationScoreRepository.findByAuditionId(auditionId).stream()
                .collect(Collectors.toMap(ApplicationScore::getApplicationId, Function.identity(), (a, b) -> a));

        UUID voterId = SecurityUtils.getCurrentUserId();
        final String myVoteStr = voterId == null
                ? null
                : voteRepository.findByAuditionIdAndUserIdAndRoundNumber(auditionId, voterId, round)
                        .map(v -> v.getApplicationId().toString())
                        .orElse(null);

        long totalVotes = votingEnabled ? voteRepository.countByAuditionIdAndRoundNumber(auditionId, round) : 0L;

        List<PublicVoteItemDto> allItems = apps.stream()
                .map(app -> toVoteItem(app, myVoteStr, scoreByApp.get(app.getId()), roundVotes.getOrDefault(app.getId(), 0L)))
                .collect(Collectors.toList());

        List<PublicVoteItemDto> visible = new ArrayList<>(filterByCategory(allItems, categoryFilter));
        PublicVoteItemDto sharedDto = null;
        if (shared != null) {
            final String sharedId = shared.getId().toString();
            sharedDto = allItems.stream().filter(i -> sharedId.equals(i.getApplicationId())).findFirst()
                    .orElse(toVoteItem(shared, votingEnabled ? myVoteStr : null, scoreByApp.get(shared.getId()), 0L));
            // 공유 링크로 들어오면 해당 후보를 맨 위에 둔다. 순위(rank)·득표는 바꾸지 않는다.
            visible.removeIf(i -> sharedId.equals(i.getApplicationId()));
            if (showItems) {
                visible.add(0, sharedDto);
            }
        }

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
        out.setMyVoteApplicationId(votingEnabled ? myVoteStr : null);
        out.setVotingEnabled(votingEnabled);
        out.setVotingPlanEnabled(planEnabled);
        out.setRoundNumber(round);
        out.setVoteStatus(phase.name());
        boolean currentWindow = round == currentRound;
        out.setVoteStartAt(currentWindow ? audition.getVoteStartAt() : null);
        out.setVoteEndAt(currentWindow ? audition.getVoteEndAt() : null);
        out.setVoteRoundNumber(audition.getVoteRoundNumber());
        out.setSharedCandidate(sharedDto);
        out.setItems(visible);
        return out;
    }

    private List<Application> loadVoteApplications(Audition audition, int round, VoteWindow.Phase phase) {
        if (VoteWindow.hasStarted(phase)) {
            List<java.util.UUID> ids = voteCandidates.findByAuditionIdAndRoundNumber(audition.getId(), round).stream()
                    .map(AuditionVoteCandidate::getApplicationId)
                    .toList();
            if (ids.isEmpty()) {
                return List.of();
            }
            Map<java.util.UUID, Application> byId = applicationRepository.findAllById(ids).stream()
                    .collect(Collectors.toMap(Application::getId, Function.identity(), (a, b) -> a));
            List<Application> ordered = new ArrayList<>();
            for (java.util.UUID id : ids) {
                Application app = byId.get(id);
                if (app != null) {
                    ordered.add(app);
                }
            }
            return ordered;
        }
        return applicationRepository.findByAuditionIdAndStatusInOrderByCreatedAtDesc(
                        audition.getId(), LISTABLE_STATUSES).stream()
                .filter(app -> VotingRoundPlan.isRoundCandidate(audition, app, round))
                .collect(Collectors.toList());
    }

    private Map<UUID, Long> roundVoteCounts(UUID auditionId, int round) {
        return voteRepository.countByApplicationForRound(auditionId, round).stream()
                .collect(Collectors.toMap(r -> (UUID) r[0], r -> ((Number) r[1]).longValue(), Long::sum));
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

    private PublicVoteItemDto toVoteItem(
            Application app, String myVoteApplicationId, ApplicationScore score, long roundVoteCount) {
        User applicant = userRepository.findById(app.getApplicantId()).orElse(null);
        var m = metricsLoader.resolve(app);

        String appIdStr = app.getId().toString();
        boolean isVoted = myVoteApplicationId != null && myVoteApplicationId.equals(appIdStr);
        int rank = score != null && score.getRecommendedRank() != null ? score.getRecommendedRank() : 0;

        PublicVoteItemDto dto = new PublicVoteItemDto();
        dto.setApplicationId(appIdStr);
        dto.setUserName(applicant != null ? applicant.getPublicDisplayLabel() : "");
        // 공개(비로그인) 목록이므로 이메일은 내보내지 않는다.
        dto.setUserEmail("");
        dto.setDescription(applicant != null && applicant.getBio() != null ? applicant.getBio() : "");
        dto.setVideoUrl(m.videoUrl());
        dto.setThumbnailUrl(m.thumbnailUrl());
        dto.setCategory(m.category());
        dto.setVoteCount(roundVoteCount);
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
        int round = audition.getVoteRoundNumber() != null
                ? audition.getVoteRoundNumber()
                : VotingRoundPlan.activeRound(audition);
        if (!VotingRoundPlan.enabledFor(audition.getVotingRounds(), round)) {
            throw ReasonCode.VOTING_DISABLED_FOR_ROUND.toException();
        }
        assertVoteWindowOpen(audition);
        if (voteCandidates.countByAuditionIdAndRoundNumber(audition.getId(), round) > 0) {
            if (!voteCandidates.existsByAuditionIdAndRoundNumberAndApplicationId(audition.getId(), round, app.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이번 회차 투표 대상이 아닌 지원입니다.");
            }
        } else if (!VotingRoundPlan.isRoundCandidate(audition, app, round)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이번 회차 투표 대상이 아닌 지원입니다.");
        }

        // 사용자는 오디션·회차마다 1표. 같은 회차 안에서는 다른 지원으로 옮길 수 있다.
        Optional<Vote> previous = voteRepository.findByAuditionIdAndUserIdAndRoundNumber(audition.getId(), voterId, round);
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
        row.setRoundNumber(round);
        voteRepository.save(row);

        applicationRankingService.recalculateScores(auditionId);
        return new VoteMutationResultDto(app.getId().toString(), replaced);
    }

    @Transactional
    public void removeVote(UUID applicationId) {
        assertAuthenticatedMayVote();
        UUID voterId = requireUserId();

        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "해당 투표를 찾을 수 없습니다."));
        Audition audition = auditionRepository.findById(app.getAuditionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "해당 투표를 찾을 수 없습니다."));
        // 취소는 현재 회차의 내 표만. 지난 회차 표는 그대로 둔다(회차가 끝난 기록).
        assertVoteWindowOpen(audition);
        int round = audition.getVoteRoundNumber() != null
                ? audition.getVoteRoundNumber()
                : VotingRoundPlan.activeRound(audition);
        Vote vote = voteRepository.findByAuditionIdAndUserIdAndRoundNumber(audition.getId(), voterId, round)
                .filter(v -> v.getApplicationId().equals(applicationId))
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

    private static void assertVoteWindowOpen(Audition audition) {
        VoteWindow.Phase phase = VoteWindow.phase(audition, Instant.now());
        if (phase == VoteWindow.Phase.OPEN) {
            return;
        }
        if (phase == VoteWindow.Phase.SCHEDULED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "투표가 아직 시작되지 않았습니다.");
        }
        if (phase == VoteWindow.Phase.CLOSED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "투표 기간이 종료되었습니다.");
        }
        throw new ResponseStatusException(HttpStatus.CONFLICT, "투표가 아직 시작되지 않았습니다.");
    }

    private static UUID requireUserId() {
        UUID id = SecurityUtils.getCurrentUserId();
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        return id;
    }
}
