package com.audition.platform.application.ranking;

import com.audition.platform.api.dto.RankingItemDto;
import com.audition.platform.api.dto.RankingPageDataDto;
import com.audition.platform.application.audition.ApplicantCardMetricsLoader;
import com.audition.platform.application.me.MeApiMapping;
import com.audition.platform.application.vote.VoteWindow;
import com.audition.platform.application.vote.VotingRoundPlan;
import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.score.ApplicationScore;
import com.audition.platform.domain.score.ApplicationScoreRepository;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import com.audition.platform.domain.vote.VoteRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 회차 랭킹 = 현재 회차 득표 순위. 투표를 켠 회차는 누구나(비로그인 포함) 볼 수 있고, 투표 없는 회차는 비활성 상태를 돌려준다.
 * <p>
 * 공개 응답에는 공개 표시 이름·프로필 이미지·회차 득표·순위만 담는다(이메일·연락처·지원 상태·심사 점수 없음).
 * 공고 소유 기획사·관리자는 같은 순위에 분류·조회수·지원 상태·추천 점수를 더 받는다({@code manageView=true}).
 * </p>
 */
@Service
public class AuditionRankingQueryService {

    private static final List<String> LISTABLE_STATUSES = List.of("SUBMITTED", "REVIEWING", "ACCEPTED");

    private final AuditionRepository auditionRepository;
    private final ApplicationRepository applicationRepository;
    private final ApplicationScoreRepository applicationScoreRepository;
    private final UserRepository userRepository;
    private final ApplicationRankingService applicationRankingService;
    private final ApplicantCardMetricsLoader metricsLoader;
    private final VoteRepository voteRepository;

    public AuditionRankingQueryService(
            AuditionRepository auditionRepository,
            ApplicationRepository applicationRepository,
            ApplicationScoreRepository applicationScoreRepository,
            UserRepository userRepository,
            ApplicationRankingService applicationRankingService,
            ApplicantCardMetricsLoader metricsLoader,
            VoteRepository voteRepository) {
        this.auditionRepository = auditionRepository;
        this.applicationRepository = applicationRepository;
        this.applicationScoreRepository = applicationScoreRepository;
        this.userRepository = userRepository;
        this.applicationRankingService = applicationRankingService;
        this.metricsLoader = metricsLoader;
        this.voteRepository = voteRepository;
    }

    public RankingPageDataDto getRanking(UUID auditionId) {
        Audition audition = auditionRepository.findById(auditionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "오디션을 찾을 수 없습니다."));
        boolean manager = isOwnerOrAdmin(audition);
        if (!manager && "DRAFT".equals(audition.getStatus())) {
            // 게시 전 공고의 랭킹은 공개하지 않는다.
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "오디션을 찾을 수 없습니다.");
        }
        Instant now = Instant.now();
        VoteWindow.Phase phase = VoteWindow.phase(audition, now);
        int round = audition.getVoteRoundNumber() != null
                ? audition.getVoteRoundNumber()
                : VotingRoundPlan.activeRound(audition);

        RankingPageDataDto out = new RankingPageDataDto();
        out.setRoundNumber(round);
        out.setManageView(manager);
        // 랭킹은 투표를 따른다. 공개 결과는 투표가 시작된 뒤(진행 중·종료)만. 기획사는 시작 전에도 볼 수 있다.
        boolean planEnabled = VotingRoundPlan.enabledNow(audition)
                || (audition.getVoteRoundNumber() != null
                    && VotingRoundPlan.enabledFor(audition.getVotingRounds(), audition.getVoteRoundNumber()));
        boolean publicResults = phase == VoteWindow.Phase.OPEN || phase == VoteWindow.Phase.CLOSED;
        if (!planEnabled || (!manager && !publicResults)) {
            out.setVotingEnabled(false);
            return out;
        }

        List<Application> candidates = applicationRepository
                .findByAuditionIdAndStatusInOrderByCreatedAtDesc(auditionId, LISTABLE_STATUSES).stream()
                .filter(app -> VotingRoundPlan.isRoundCandidate(audition, app, round))
                .sorted(Comparator.comparing(Application::getCreatedAt))
                .collect(Collectors.toList());
        Map<UUID, Long> votes = applicationRankingService.currentRoundVotes(auditionId);

        UUID viewerId = SecurityUtils.getCurrentUserId();
        UUID myVoteApp = viewerId == null ? null
                : voteRepository.findByAuditionIdAndUserIdAndRoundNumber(auditionId, viewerId, round)
                        .map(v -> v.getApplicationId()).orElse(null);

        Map<UUID, ApplicationScore> scores = Map.of();
        if (manager && !candidates.isEmpty()) {
            if (applicationScoreRepository.countByAuditionId(auditionId) == 0) {
                applicationRankingService.recalculateScores(auditionId);
            }
            scores = applicationScoreRepository.findByAuditionId(auditionId).stream()
                    .collect(Collectors.toMap(ApplicationScore::getApplicationId, Function.identity(), (a, b) -> a));
        }

        // 득표 내림차순, 동률은 먼저 지원한 순. 같은 득표는 같은 순위(1,1,3).
        List<Application> ordered = new ArrayList<>(candidates);
        ordered.sort(Comparator.comparingLong((Application a) -> votes.getOrDefault(a.getId(), 0L)).reversed());

        List<RankingItemDto> items = new ArrayList<>();
        long prevVotes = -1;
        int prevRank = 0;
        for (int i = 0; i < ordered.size(); i++) {
            Application app = ordered.get(i);
            long v = votes.getOrDefault(app.getId(), 0L);
            int rank = v == prevVotes ? prevRank : i + 1;
            prevVotes = v;
            prevRank = rank;

            User u = userRepository.findById(app.getApplicantId()).orElse(null);
            RankingItemDto dto = new RankingItemDto();
            dto.setApplicationId(app.getId().toString());
            dto.setUserName(u != null ? u.getPublicDisplayLabel() : "");
            dto.setAvatarUrl(u != null ? blankToNull(u.getProfileImageUrl()) : null);
            dto.setVoteCount(v);
            dto.setRank(rank);
            dto.setVoted(app.getId().equals(myVoteApp));
            if (manager) {
                var m = metricsLoader.resolve(app);
                ApplicationScore sc = scores.get(app.getId());
                dto.setCategory(m.category());
                dto.setViewCount(m.viewCount());
                dto.setStatus(MeApiMapping.applicationStatusToApi(app.getStatus()));
                dto.setScore(sc != null ? sc.getWeightedScore() : 0.0);
                dto.setRecommended(sc != null && sc.isRecommended());
            }
            items.add(dto);
        }
        out.setItems(items);
        return out;
    }

    private static boolean isOwnerOrAdmin(Audition audition) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null || SecurityUtils.hasRole("APPLICANT")) {
            return false;
        }
        return audition.getOwnerId().equals(currentUserId) || SecurityUtils.hasRole("ADMIN");
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s;
    }
}
