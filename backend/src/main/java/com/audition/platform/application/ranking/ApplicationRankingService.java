package com.audition.platform.application.ranking;

import com.audition.platform.application.audition.ApplicantCardMetricsLoader;
import com.audition.platform.application.audition.ApplicantCardMetricsLoader.ApplicantCardMetrics;
import com.audition.platform.domain.audition.Application;
import com.audition.platform.application.vote.VotingRoundPlan;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.vote.VoteRepository;
import com.audition.platform.domain.score.ApplicationScore;
import com.audition.platform.domain.score.ApplicationScoreRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 오디션 단위 랭킹·추천 점수 재계산 (MVP LOCK).
 * <p>
 * voteScore = vote/maxVote*100, viewScore = view/maxView*100, likeScore = like/maxLike*100<br>
 * score = voteScore*0.55 + viewScore*0.20 + statusWeight*0.20 + likeScore*0.05
 * </p>
 */
@Service
public class ApplicationRankingService {

    public static final int TOP_RECOMMENDED_COUNT = 3;

    private static final double W_VOTE = 0.55;
    private static final double W_VIEW = 0.20;
    private static final double W_STATUS = 0.20;
    private static final double W_LIKE = 0.05;

    private final ApplicationRepository applicationRepository;
    private final ApplicationScoreRepository applicationScoreRepository;
    private final ApplicantCardMetricsLoader metricsLoader;
    private final AuditionRepository auditionRepository;
    private final VoteRepository voteRepository;

    public ApplicationRankingService(
            ApplicationRepository applicationRepository,
            ApplicationScoreRepository applicationScoreRepository,
            ApplicantCardMetricsLoader metricsLoader,
            AuditionRepository auditionRepository,
            VoteRepository voteRepository) {
        this.applicationRepository = applicationRepository;
        this.applicationScoreRepository = applicationScoreRepository;
        this.metricsLoader = metricsLoader;
        this.auditionRepository = auditionRepository;
        this.voteRepository = voteRepository;
    }

    /** 현재 회차 득표(지원 ID → 표 수). 회차마다 새로 받으므로 점수·랭킹은 이 값을 쓴다. */
    public Map<UUID, Long> currentRoundVotes(UUID auditionId) {
        Map<UUID, Long> out = new HashMap<>();
        auditionRepository.findById(auditionId).ifPresent(a -> {
            for (Object[] r : voteRepository.countByApplicationForRound(auditionId, VotingRoundPlan.activeRound(a))) {
                out.merge((UUID) r[0], ((Number) r[1]).longValue(), Long::sum);
            }
        });
        return out;
    }

    /**
     * 해당 오디션의 모든 지원에 대해 점수·순위·추천 플래그를 {@code application_scores}에 반영합니다.
     */
    @Transactional
    public void recalculateScores(UUID auditionId) {
        List<Application> apps = applicationRepository.findByAuditionIdOrderByCreatedAtDesc(auditionId);
        if (apps.isEmpty()) {
            return;
        }

        Map<UUID, Long> roundVotes = currentRoundVotes(auditionId);
        List<ScoreRow> rows = new ArrayList<>();
        for (Application app : apps) {
            ApplicantCardMetrics m = metricsLoader.resolve(app);
            rows.add(new ScoreRow(app, m, roundVotes.getOrDefault(app.getId(), 0L)));
        }

        long maxVote = rows.stream().mapToLong(r -> r.voteCount).max().orElse(0);
        long maxView = rows.stream().mapToLong(r -> r.metrics.viewCount()).max().orElse(0);
        long maxLike = rows.stream().mapToLong(r -> r.metrics.likeCount()).max().orElse(0);

        for (ScoreRow r : rows) {
            double voteScore = normalize(r.voteCount, maxVote);
            double viewScore = normalize(r.metrics.viewCount(), maxView);
            double likeScore = normalize(r.metrics.likeCount(), maxLike);
            double statusW = statusWeight(r.app.getStatus());
            double score = voteScore * W_VOTE + viewScore * W_VIEW + statusW * W_STATUS + likeScore * W_LIKE;
            r.score = round1(score);
        }

        rows.sort(Comparator.<ScoreRow>comparingDouble(row -> row.score).reversed()
                .thenComparing(row -> row.app.getId()));

        for (int i = 0; i < rows.size(); i++) {
            rows.get(i).rank = i + 1;
        }

        Instant now = Instant.now();
        for (ScoreRow r : rows) {
            ApplicationScore s = applicationScoreRepository.findById(r.app.getId())
                    .orElseGet(() -> {
                        ApplicationScore created = new ApplicationScore();
                        created.setApplicationId(r.app.getId());
                        return created;
                    });
            s.setAuditionId(auditionId);
            s.setVoteCount(r.voteCount);
            s.setTotalViewCount(r.metrics.viewCount());
            s.setLikeCount(r.metrics.likeCount());
            s.setWeightedScore(r.score);
            s.setRecommendedRank(r.rank);
            s.setRecommended(r.rank <= TOP_RECOMMENDED_COUNT);
            s.setUpdatedAt(now);
            applicationScoreRepository.save(s);
        }
    }

    private static double normalize(long value, long max) {
        if (max <= 0) {
            return 0;
        }
        return 100.0 * value / max;
    }

    private static double statusWeight(String dbStatus) {
        if (dbStatus == null) {
            return 0;
        }
        return switch (dbStatus) {
            case "SUBMITTED" -> 20;
            case "REVIEWING" -> 60;
            case "ACCEPTED" -> 100;
            case "REJECTED" -> 0;
            default -> 0;
        };
    }

    private static double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    private static final class ScoreRow {
        final Application app;
        final ApplicantCardMetrics metrics;
        final long voteCount;
        double score;
        int rank;

        ScoreRow(Application app, ApplicantCardMetrics metrics, long voteCount) {
            this.app = app;
            this.metrics = metrics;
            this.voteCount = voteCount;
        }
    }
}
