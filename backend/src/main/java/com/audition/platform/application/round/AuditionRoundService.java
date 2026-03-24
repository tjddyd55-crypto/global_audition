package com.audition.platform.application.round;

import com.audition.platform.domain.audition.ApplicationRoundSubmissionRepository;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.audition.AuditionRound;
import com.audition.platform.domain.audition.AuditionRoundRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuditionRoundService {

    private final AuditionRoundRepository roundRepository;
    private final ApplicationRoundSubmissionRepository submissionRepository;
    private final AuditionRepository auditionRepository;

    public AuditionRoundService(
            AuditionRoundRepository roundRepository,
            ApplicationRoundSubmissionRepository submissionRepository,
            AuditionRepository auditionRepository) {
        this.roundRepository = roundRepository;
        this.submissionRepository = submissionRepository;
        this.auditionRepository = auditionRepository;
    }

    /**
     * MULTI_ROUND 오디션 생성 직후 1차 라운드 자동 생성.
     */
    @Transactional
    public AuditionRound bootstrapFirstRound(UUID auditionId, boolean auditionIsOpen) {
        Optional<AuditionRound> existing = roundRepository.findByAuditionIdAndRoundNumber(auditionId, 1);
        if (existing.isPresent()) {
            return existing.get();
        }
        AuditionRound r = new AuditionRound();
        r.setAuditionId(auditionId);
        r.setRoundNumber(1);
        r.setRoundName("1차");
        r.setReviewMethod("INTERNAL_REVIEW");
        r.setRequiredSubmissionType("VIDEO");
        r.setActive(auditionIsOpen);
        return roundRepository.save(r);
    }

    @Transactional(readOnly = true)
    public List<AuditionRound> listRounds(UUID auditionId) {
        return roundRepository.findByAuditionIdOrderByRoundNumberAsc(auditionId);
    }

    @Transactional(readOnly = true)
    public AuditionRound requireRoundBelongsToAudition(UUID auditionId, UUID roundId) {
        AuditionRound round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "라운드를 찾을 수 없습니다."));
        if (!round.getAuditionId().equals(auditionId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "오디션과 라운드가 일치하지 않습니다.");
        }
        return round;
    }

    @Transactional
    public AuditionRound createRound(
            UUID auditionId,
            String roundName,
            String reviewMethod,
            String requiredSubmissionType,
            Instant startAt,
            Instant endAt) {
        Audition audition = auditionRepository.findById(auditionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "오디션을 찾을 수 없습니다."));
        if (!AuditionProcessModes.isMultiRound(audition.getProcessMode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "다단계 오디션에서만 라운드를 추가할 수 있습니다.");
        }
        List<AuditionRound> existing = roundRepository.findByAuditionIdOrderByRoundNumberAsc(auditionId);
        int nextNum = existing.isEmpty() ? 1 : existing.get(existing.size() - 1).getRoundNumber() + 1;
        AuditionRound r = new AuditionRound();
        r.setAuditionId(auditionId);
        r.setRoundNumber(nextNum);
        r.setRoundName(roundName != null && !roundName.isBlank() ? roundName.trim() : nextNum + "차");
        r.setReviewMethod(reviewMethod != null ? reviewMethod : "INTERNAL_REVIEW");
        r.setRequiredSubmissionType(requiredSubmissionType != null ? requiredSubmissionType : "VIDEO");
        r.setStartAt(startAt);
        r.setEndAt(endAt);
        r.setActive(false);
        AuditionRound saved = roundRepository.save(r);
        Integer max = audition.getMaxRoundNumber();
        if (max == null || saved.getRoundNumber() > max) {
            audition.setMaxRoundNumber(saved.getRoundNumber());
            auditionRepository.save(audition);
        }
        return saved;
    }

    @Transactional
    public AuditionRound updateRound(
            UUID auditionId,
            UUID roundId,
            String roundName,
            Instant startAt,
            Instant endAt,
            String reviewMethod,
            String requiredSubmissionType) {
        AuditionRound round = requireRoundBelongsToAudition(auditionId, roundId);
        boolean hasAnySubmissionRow = submissionRepository.existsByRoundId(roundId);
        boolean roundOperational =
                round.isActive() || submissionRepository.existsNonTrivialActivityForRound(roundId);

        if (roundName != null && !roundName.isBlank()) {
            round.setRoundName(roundName.trim());
        }
        if (startAt != null) {
            round.setStartAt(startAt);
        }
        if (endAt != null) {
            round.setEndAt(endAt);
        }

        if (reviewMethod != null && !reviewMethod.equals(round.getReviewMethod())) {
            if (roundOperational) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 시작된 라운드는 심사 방식을 변경할 수 없습니다.");
            }
            round.setReviewMethod(reviewMethod);
        }
        if (requiredSubmissionType != null && !requiredSubmissionType.equals(round.getRequiredSubmissionType())) {
            if (hasAnySubmissionRow) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "제출 레코드가 있는 라운드는 제출 유형을 변경할 수 없습니다.");
            }
            round.setRequiredSubmissionType(requiredSubmissionType);
        }
        return roundRepository.save(round);
    }

    @Transactional
    public AuditionRound openRound(UUID auditionId, UUID roundId) {
        AuditionRound round = requireRoundBelongsToAudition(auditionId, roundId);
        if (round.isActive()) {
            return round;
        }
        round.setActive(true);
        Audition audition = auditionRepository.findById(auditionId).orElseThrow();
        audition.setCurrentRoundNumber(round.getRoundNumber());
        auditionRepository.save(audition);
        return roundRepository.save(round);
    }

    @Transactional
    public AuditionRound closeRound(UUID auditionId, UUID roundId) {
        AuditionRound round = requireRoundBelongsToAudition(auditionId, roundId);
        round.setActive(false);
        return roundRepository.save(round);
    }

    @Transactional(readOnly = true)
    public Optional<AuditionRound> findNextRound(UUID auditionId, int afterRoundNumber) {
        return roundRepository.findByAuditionIdOrderByRoundNumberAsc(auditionId).stream()
                .filter(r -> r.getRoundNumber() > afterRoundNumber)
                .findFirst();
    }

    @Transactional(readOnly = true)
    public boolean isLastRound(Audition audition, AuditionRound round) {
        Integer max = audition.getMaxRoundNumber();
        if (max == null) {
            return true;
        }
        return round.getRoundNumber() >= max;
    }
}
