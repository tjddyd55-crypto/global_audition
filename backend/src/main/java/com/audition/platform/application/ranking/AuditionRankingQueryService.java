package com.audition.platform.application.ranking;

import com.audition.platform.application.vote.VotingRoundPlan;

import com.audition.platform.api.dto.RankingItemDto;
import com.audition.platform.api.dto.RankingPageDataDto;
import com.audition.platform.application.audition.ApplicantCardMetricsLoader;
import com.audition.platform.application.me.MeApiMapping;
import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.score.ApplicationScore;
import com.audition.platform.domain.score.ApplicationScoreRepository;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class AuditionRankingQueryService {

    private final AuditionRepository auditionRepository;
    private final ApplicationRepository applicationRepository;
    private final ApplicationScoreRepository applicationScoreRepository;
    private final UserRepository userRepository;
    private final ApplicationRankingService applicationRankingService;
    private final ApplicantCardMetricsLoader metricsLoader;

    public AuditionRankingQueryService(
            AuditionRepository auditionRepository,
            ApplicationRepository applicationRepository,
            ApplicationScoreRepository applicationScoreRepository,
            UserRepository userRepository,
            ApplicationRankingService applicationRankingService,
            ApplicantCardMetricsLoader metricsLoader) {
        this.auditionRepository = auditionRepository;
        this.applicationRepository = applicationRepository;
        this.applicationScoreRepository = applicationScoreRepository;
        this.userRepository = userRepository;
        this.applicationRankingService = applicationRankingService;
        this.metricsLoader = metricsLoader;
    }

    public RankingPageDataDto getRanking(UUID auditionId) {
        Audition audition = auditionRepository.findById(auditionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "오디션을 찾을 수 없습니다."));
        assertAgencyOrAdminCanManageAudition(audition);

        // 랭킹은 투표를 따른다. 이 회차가 투표 없음이면 오류가 아니라 비활성 상태로 돌려준다(데이터는 유지).
        if (!VotingRoundPlan.enabledNow(audition)) {
            RankingPageDataDto disabled = new RankingPageDataDto();
            disabled.setVotingEnabled(false);
            disabled.setRoundNumber(VotingRoundPlan.activeRound(audition));
            return disabled;
        }

        if (applicationScoreRepository.countByAuditionId(auditionId) == 0) {
            applicationRankingService.recalculateScores(auditionId);
        }

        List<ApplicationScore> scores = new ArrayList<>(applicationScoreRepository.findByAuditionId(auditionId));
        scores.sort(Comparator.comparingInt(s -> s.getRecommendedRank() != null ? s.getRecommendedRank() : Integer.MAX_VALUE));

        List<RankingItemDto> items = new ArrayList<>();
        for (ApplicationScore sc : scores) {
            Application app = applicationRepository.findById(sc.getApplicationId()).orElse(null);
            if (app == null) {
                continue;
            }
            User u = userRepository.findById(app.getApplicantId()).orElse(null);
            var m = metricsLoader.resolve(app);
            RankingItemDto dto = new RankingItemDto();
            dto.setApplicationId(app.getId().toString());
            dto.setUserName(u != null ? u.getPublicDisplayLabel() : "");
            dto.setCategory(m.category());
            dto.setVoteCount(sc.getVoteCount());
            dto.setViewCount(sc.getTotalViewCount());
            dto.setStatus(MeApiMapping.applicationStatusToApi(app.getStatus()));
            dto.setScore(sc.getWeightedScore());
            dto.setRank(sc.getRecommendedRank() != null ? sc.getRecommendedRank() : 0);
            dto.setRecommended(sc.isRecommended());
            dto.setVoted(false);
            items.add(dto);
        }

        RankingPageDataDto out = new RankingPageDataDto();
        out.setItems(items);
        out.setRoundNumber(VotingRoundPlan.activeRound(audition));
        return out;
    }

    private void assertAgencyOrAdminCanManageAudition(Audition audition) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        if (SecurityUtils.hasRole("APPLICANT")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "지원자는 이 작업을 수행할 수 없습니다.");
        }
        if (!audition.getOwnerId().equals(currentUserId) && !SecurityUtils.hasRole("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "해당 오디션을 관리할 권한이 없습니다.");
        }
    }
}
