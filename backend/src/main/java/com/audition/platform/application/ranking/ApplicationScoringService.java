package com.audition.platform.application.ranking;

import com.audition.platform.application.audition.ApplicantCardMetricsLoader;
import com.audition.platform.application.audition.ApplicantCardMetricsLoader.ApplicantCardMetrics;
import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.score.ApplicationScore;
import com.audition.platform.domain.score.ApplicationScoreRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

/**
 * 투표·조회·심사 상태·좋아요 가중 점수 및 추천 순위 (합격 자동 처리 없음, 참고용).
 */
@Service
public class ApplicationScoringService {

    public static final int TOP_RECOMMENDED_COUNT = 3;

    private static final double W_VOTE = 0.55;
    private static final double W_VIEW = 0.20;
    private static final double W_STATUS = 0.20;
    private static final double W_LIKE = 0.05;

    private final ApplicationRepository applicationRepository;
    private final ApplicationScoreRepository applicationScoreRepository;
    private final ApplicantCardMetricsLoader metricsLoader;

    public ApplicationScoringService(
            ApplicationRepository applicationRepository,
            ApplicationScoreRepository applicationScoreRepository,
            ApplicantCardMetricsLoader metricsLoader) {
        this.applicationRepository = applicationRepository;
        this.applicationScoreRepository = applicationScoreRepository;
        this.metricsLoader = metricsLoader;
    }

    @Transactional
    public void recalculateForAudition(UUID auditionId) {
        List<Application> apps = applicationRepository.findByAuditionIdOrderByCreatedAtDesc(auditionId);
        if (apps.isEmpty()) {
            return;
        }

        List<Row> rows = new ArrayList<>();
        for (Application app : apps) {
            ApplicantCardMetrics m = metricsLoader.resolve(app);
            rows.add(new Row(app, m, app.getVoteCount()));
        }

        long maxVote = rows.stream().mapToLong(r -> r.voteCount).max().orElse(0);
        long maxView = rows.stream().mapToLong(r -> r.metrics.viewCount()).max().orElse(0);
        long maxLike = rows.stream().mapToLong(r -> r.metrics.likeCount()).max().orElse(0);

        for (Row r : rows) {
            double vNorm = normalize(r.voteCount, maxVote);
            double viewNorm = normalize(r.metrics.viewCount(), maxView);
            double likeNorm = normalize(r.metrics.likeCount(), maxLike);
            double statusW = statusWeight(r.app.getStatus());
            double score = vNorm * W_VOTE + viewNorm * W_VIEW + statusW * W_STATUS + likeNorm * W_LIKE;
            r.score = round1(score);
        }

        rows.sort(Comparator.<Row>comparingDouble(row -> row.score).reversed()
                .thenComparing(row -> row.app.getId()));

        for (int i = 0; i < rows.size(); i++) {
            rows.get(i).rank = i + 1;
        }

        Instant now = Instant.now();
        for (Row r : rows) {
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
            s.setRecommended(r.rank <= TOP_RECOMMENDED_COUNT && r.score > 0);
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

    private static final class Row {
        final Application app;
        final ApplicantCardMetrics metrics;
        final long voteCount;
        double score;
        int rank;

        Row(Application app, ApplicantCardMetrics metrics, long voteCount) {
            this.app = app;
            this.metrics = metrics;
            this.voteCount = voteCount;
        }
    }
}
