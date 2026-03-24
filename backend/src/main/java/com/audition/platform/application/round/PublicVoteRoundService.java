package com.audition.platform.application.round;

import com.audition.platform.domain.audition.ApplicationRoundSubmission;
import com.audition.platform.domain.audition.ApplicationRoundSubmissionRepository;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.audition.AuditionRound;
import com.audition.platform.domain.audition.AuditionRoundRepository;
import com.audition.platform.domain.vote.Vote;
import com.audition.platform.domain.vote.VoteRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 공개 투표 라운드 — votes.application_round_submission_id 를 진실 원천으로 사용.
 * round_id IS NULL 인 레거시 흐름은 {@link com.audition.platform.application.vote.PublicVoteService} 유지.
 */
@Service
public class PublicVoteRoundService {

    private static final List<String> VOTEABLE_SUBMISSION = List.of("SUBMITTED", "UNDER_REVIEW", "PASSED");

    private final AuditionRepository auditionRepository;
    private final AuditionRoundRepository roundRepository;
    private final ApplicationRoundSubmissionRepository submissionRepository;
    private final VoteRepository voteRepository;

    public PublicVoteRoundService(
            AuditionRepository auditionRepository,
            AuditionRoundRepository roundRepository,
            ApplicationRoundSubmissionRepository submissionRepository,
            VoteRepository voteRepository) {
        this.auditionRepository = auditionRepository;
        this.roundRepository = roundRepository;
        this.submissionRepository = submissionRepository;
        this.voteRepository = voteRepository;
    }

    @Transactional(readOnly = true)
    public List<ApplicationRoundSubmission> listCandidates(UUID roundId) {
        AuditionRound round = loadPublicVoteRound(roundId);
        return submissionRepository.findByRoundId(round.getId()).stream()
                .filter(s -> VOTEABLE_SUBMISSION.contains(s.getSubmissionStatus()))
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean canUserVote(UUID roundId, UUID userId) {
        if (userId == null) {
            return false;
        }
        AuditionRound round = roundRepository.findById(roundId).orElse(null);
        if (round == null || !round.isActive() || !"PUBLIC_VOTE".equals(round.getReviewMethod())) {
            return false;
        }
        Audition audition = auditionRepository.findById(round.getAuditionId()).orElse(null);
        return audition != null && "OPEN".equals(audition.getStatus());
    }

    @Transactional
    public Vote castVote(UUID roundId, UUID applicationRoundSubmissionId) {
        UUID voterId = SecurityUtils.getCurrentUserId();
        if (voterId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        AuditionRound round = loadPublicVoteRound(roundId);
        Audition audition = auditionRepository.findById(round.getAuditionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "오디션을 찾을 수 없습니다."));
        if (!"OPEN".equals(audition.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "모집 중인 오디션에서만 투표할 수 있습니다.");
        }
        ApplicationRoundSubmission sub = submissionRepository
                .findById(applicationRoundSubmissionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "제출을 찾을 수 없습니다."));
        if (!sub.getRoundId().equals(roundId) || !sub.getAuditionId().equals(audition.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "라운드와 제출이 일치하지 않습니다.");
        }
        if (!VOTEABLE_SUBMISSION.contains(sub.getSubmissionStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "투표 대상이 아닌 제출 상태입니다.");
        }

        Optional<Vote> previous = voteRepository.findByRoundIdAndUserId(roundId, voterId);
        if (previous.isPresent()) {
            Vote pv = previous.get();
            if (applicationRoundSubmissionId.equals(pv.getApplicationRoundSubmissionId())) {
                return pv;
            }
            if (pv.getApplicationRoundSubmissionId() != null) {
                int dec = submissionRepository.adjustVoteCount(pv.getApplicationRoundSubmissionId(), -1);
                if (dec != 1) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "투표 수 동기화 오류가 발생했습니다.");
                }
            }
            voteRepository.delete(pv);
        }

        int inc = submissionRepository.adjustVoteCount(applicationRoundSubmissionId, 1);
        if (inc != 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "투표 반영에 실패했습니다.");
        }

        Vote row = new Vote();
        row.setAuditionId(audition.getId());
        row.setApplicationId(sub.getApplicationId());
        row.setUserId(voterId);
        row.setRoundId(roundId);
        row.setApplicationRoundSubmissionId(applicationRoundSubmissionId);
        return voteRepository.save(row);
    }

    @Transactional(readOnly = true)
    public long countVotesForSubmission(UUID applicationRoundSubmissionId) {
        return voteRepository.countByApplicationRoundSubmissionId(applicationRoundSubmissionId);
    }

    private AuditionRound loadPublicVoteRound(UUID roundId) {
        AuditionRound round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "라운드를 찾을 수 없습니다."));
        if (!"PUBLIC_VOTE".equals(round.getReviewMethod())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "공개 투표 라운드가 아닙니다.");
        }
        if (!round.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "활성화되지 않은 라운드입니다.");
        }
        return round;
    }
}
