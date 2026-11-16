package com.audition.platform.application.vote;

import com.audition.platform.application.round.AuditionProcessModes;
import com.audition.platform.domain.audition.Audition;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.TreeSet;

/**
 * 공고별 회차 투표 설정. 랭킹은 투표를 따른다(투표 없는 회차는 랭킹도 없음).
 *
 * <ul>
 *   <li>{@code votingRounds == null}: 설정 전(기존 공고) — 모든 회차 투표 가능. 기존 동작 그대로.</li>
 *   <li>빈 배열: 투표 없음.</li>
 *   <li>{@code [3]}: 3차만, {@code [1,2,3]}: 모든 회차.</li>
 * </ul>
 * 회차 번호는 MULTI_ROUND 면 current_round_number, 아니면 series_round(시리즈 차수)다.
 * 설정을 끈 회차에 이미 있는 투표는 지우지 않는다. 새 투표만 막고 공개 화면에서 숨긴다.
 */
public final class VotingRoundPlan {

    public static final int MAX_ROUNDS = 10;

    private VotingRoundPlan() {
    }

    /** 현재 투표 기준 회차 번호(1부터). */
    public static int activeRound(Audition a) {
        if (AuditionProcessModes.isMultiRound(a.getProcessMode())) {
            Integer cur = a.getCurrentRoundNumber();
            return cur != null && cur > 0 ? cur : 1;
        }
        return a.getSeriesRound() > 0 ? a.getSeriesRound() : 1;
    }

    public static boolean enabledFor(Integer[] votingRounds, int roundNumber) {
        if (votingRounds == null) {
            return true;
        }
        for (Integer r : votingRounds) {
            if (r != null && r == roundNumber) {
                return true;
            }
        }
        return false;
    }

    public static boolean enabledNow(Audition a) {
        return enabledFor(a.getVotingRounds(), activeRound(a));
    }

    /**
     * 요청 값 검증·정규화(중복 제거·오름차순). count 는 1~10, 회차는 1~count.
     * count 가 없으면 지정 회차 중 최댓값(없으면 1)을 쓴다.
     */
    public static Normalized normalize(Integer count, List<Integer> rounds) {
        if (rounds == null) {
            throw new IllegalArgumentException("rounds must not be null");
        }
        TreeSet<Integer> set = new TreeSet<>();
        for (Integer r : rounds) {
            if (r == null) {
                continue;
            }
            if (r < 1 || r > MAX_ROUNDS) {
                throw invalid("votingRounds 는 1~" + MAX_ROUNDS + " 회차만 지정할 수 있습니다.");
            }
            set.add(r);
        }
        int resolvedCount = count != null ? count : (set.isEmpty() ? 1 : set.last());
        if (resolvedCount < 1 || resolvedCount > MAX_ROUNDS) {
            throw invalid("votingRoundCount 는 1~" + MAX_ROUNDS + " 사이여야 합니다.");
        }
        if (!set.isEmpty() && set.last() > resolvedCount) {
            throw invalid("votingRounds 에 총 회차 수(" + resolvedCount + ")보다 큰 회차가 있습니다.");
        }
        return new Normalized(resolvedCount, set.toArray(new Integer[0]));
    }

    private static ResponseStatusException invalid(String message) {
        return new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, message);
    }

    public record Normalized(int count, Integer[] rounds) {
    }
}
