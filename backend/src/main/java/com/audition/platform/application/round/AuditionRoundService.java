package com.audition.platform.application.round;

import com.audition.platform.application.vote.VotingRoundPlan;

import com.audition.platform.application.i18n.Bcp47Tags;
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
    private final ApplicationRoundSubmissionService submissionService;

    public AuditionRoundService(
            AuditionRoundRepository roundRepository,
            ApplicationRoundSubmissionRepository submissionRepository,
            AuditionRepository auditionRepository,
            ApplicationRoundSubmissionService submissionService) {
        this.roundRepository = roundRepository;
        this.submissionRepository = submissionRepository;
        this.auditionRepository = auditionRepository;
        this.submissionService = submissionService;
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
        r.setRoundName(""); // 기본 이름은 비워 두고 표시 문구는 프런트 i18n(roundReview.roundLabel)으로 만든다
        // 공개 투표 여부는 공고 투표 설정(SSOT)에서 파생해 저장한다.
        Integer[] plan = auditionRepository.findById(auditionId).map(Audition::getVotingRounds).orElse(null);
        r.setReviewMethod(plan != null && VotingRoundPlan.enabledFor(plan, 1) ? "PUBLIC_VOTE" : "INTERNAL_REVIEW");
        r.setRequiredSubmissionType("VIDEO");
        r.setActive(auditionIsOpen);
        return roundRepository.save(r);
    }

    /**
     * 회차 응답의 심사 방식: 공개 투표 여부는 공고 설정에서 파생한다(단일 기준).
     */
    @Transactional(readOnly = true)
    public String effectiveReviewMethod(AuditionRound round) {
        return VotingRoundPlan.effectiveReviewMethod(round.getReviewMethod(), roundVotingEnabled(round));
    }

    @Transactional(readOnly = true)
    public boolean roundVotingEnabled(AuditionRound round) {
        return auditionRepository.findById(round.getAuditionId())
                .map(a -> VotingRoundPlan.enabledFor(a.getVotingRounds(), round.getRoundNumber()))
                .orElse(false);
    }

    /**
     * 공고 투표 설정이 바뀐 뒤 저장된 회차 심사 방식을 맞춘다(설정이 NULL 인 기존 공고는 건드리지 않는다).
     * FINAL_SELECTION 은 그대로 둔다.
     */
    @Transactional
    public void syncReviewMethodsFromPlan(Audition audition) {
        if (audition.getVotingRounds() == null) {
            return;
        }
        for (AuditionRound r : roundRepository.findByAuditionIdOrderByRoundNumberAsc(audition.getId())) {
            String want = VotingRoundPlan.effectiveReviewMethod(
                    r.getReviewMethod(), VotingRoundPlan.enabledFor(audition.getVotingRounds(), r.getRoundNumber()));
            if (!want.equals(r.getReviewMethod())) {
                r.setReviewMethod(want);
                roundRepository.save(r);
            }
        }
    }

    /** 회차 API 의 심사 방식 지정(PUBLIC_VOTE 여부)을 공고 투표 설정에 반영한다. */
    private void applyReviewMethodToPlan(Audition audition, int roundNumber, String reviewMethod, int knownRounds) {
        if (reviewMethod == null) {
            return;
        }
        if (VotingRoundPlan.setRoundEnabled(audition, roundNumber, "PUBLIC_VOTE".equals(reviewMethod), knownRounds)) {
            auditionRepository.save(audition);
        }
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
        r.setRoundName(roundName != null && !roundName.isBlank() ? roundName.trim() : "");
        // 설정 전(NULL = 모든 회차 투표) 공고에 기본값 INTERNAL_REVIEW 로 회차를 추가해도 기존 동작(투표 가능)을 바꾸지 않는다.
        // 공개 투표를 명시하거나, 설정이 있는 공고에서만 공고 설정에 반영한다.
        boolean legacyDefault = audition.getVotingRounds() == null && !"PUBLIC_VOTE".equals(reviewMethod);
        if (!legacyDefault) {
            applyReviewMethodToPlan(audition, nextNum, reviewMethod, nextNum);
        }
        boolean voting = VotingRoundPlan.enabledFor(audition.getVotingRounds(), nextNum);
        String stored = reviewMethod != null ? reviewMethod : "INTERNAL_REVIEW";
        r.setReviewMethod(audition.getVotingRounds() == null ? stored : VotingRoundPlan.effectiveReviewMethod(stored, voting));
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
        submissionService.reopenPrematurelyFinalizedApplications(auditionId);
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
            Audition audition = auditionRepository.findById(auditionId).orElseThrow();
            int known = roundRepository.findByAuditionIdOrderByRoundNumberAsc(auditionId).size();
            applyReviewMethodToPlan(audition, round.getRoundNumber(), reviewMethod, known);
        }
        if (requiredSubmissionType != null && !requiredSubmissionType.equals(round.getRequiredSubmissionType())) {
            if (hasAnySubmissionRow) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "제출 레코드가 있는 라운드는 제출 유형을 변경할 수 없습니다.");
            }
            round.setRequiredSubmissionType(requiredSubmissionType);
        }
        return roundRepository.save(round);
    }

    /**
     * 공지 문구만 바꾼다. 라운드 진행, 활성 여부, 일정, 심사 방식, 제출 유형, 오디션 상태는 건드리지 않는다.
     */
    @Transactional
    public AuditionRound updateNotices(
            UUID auditionId,
            UUID roundId,
            String announcementTitle,
            String announcementBody,
            String submissionLabel,
            String submissionGuide,
            String sourceLocale) {
        AuditionRound round = requireRoundBelongsToAudition(auditionId, roundId);
        if (announcementTitle != null) {
            round.setAnnouncementTitle(announcementTitle);
        }
        if (announcementBody != null) {
            round.setAnnouncementBody(announcementBody);
        }
        if (submissionLabel != null) {
            round.setSubmissionLabel(submissionLabel);
        }
        if (submissionGuide != null) {
            round.setSubmissionGuide(submissionGuide);
        }
        if (sourceLocale != null && !sourceLocale.isBlank()) {
            String tag = Bcp47Tags.canonicalize(sourceLocale);
            if (!tag.isEmpty()) {
                round.setNoticeSourceLocale(tag);
            }
        }
        return roundRepository.save(round);
    }

    @Transactional
    public AuditionRound openRound(UUID auditionId, UUID roundId) {
        AuditionRound round = requireRoundBelongsToAudition(auditionId, roundId);
        submissionService.reopenPrematurelyFinalizedApplications(auditionId);
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

    /**
     * 마지막 회차 여부는 이미 만들어진 회차만이 아니라, 공고에 적어 둔 총 회차(votingRoundCount)도 본다.
     * 1차만 부트스트랩된 상태에서 합격하면 지원이 조기 최종 합격 처리되던 문제를 막는다.
     */
    @Transactional(readOnly = true)
    public boolean isLastRound(Audition audition, AuditionRound round) {
        int planned = plannedLastRoundNumber(audition);
        if (planned <= 0) {
            return true;
        }
        return round.getRoundNumber() >= planned;
    }

    /**
     * @return 계획된 마지막 회차 번호. 총 회차와 maxRoundNumber 를 알 수 없으면 0.
     */
    public static int plannedLastRoundNumber(Audition audition) {
        int planned = 0;
        if (audition.getMaxRoundNumber() != null) {
            planned = Math.max(planned, audition.getMaxRoundNumber());
        }
        if (audition.getVotingRoundCount() != null) {
            planned = Math.max(planned, audition.getVotingRoundCount());
        }
        return planned;
    }
}
