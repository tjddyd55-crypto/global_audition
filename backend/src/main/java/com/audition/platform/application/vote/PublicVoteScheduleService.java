package com.audition.platform.application.vote;

import com.audition.platform.api.dto.MyVoteShareDto;
import com.audition.platform.api.dto.StartVoteRequest;
import com.audition.platform.api.dto.VoteScheduleDto;
import com.audition.platform.application.round.AuditionManageAccess;
import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.vote.AuditionVoteCandidate;
import com.audition.platform.domain.vote.AuditionVoteCandidateRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PublicVoteScheduleService {

    static final List<String> LISTABLE_STATUSES = List.of("SUBMITTED", "REVIEWING", "ACCEPTED");

    private final AuditionRepository auditionRepository;
    private final ApplicationRepository applicationRepository;
    private final AuditionVoteCandidateRepository candidates;
    private final AuditionManageAccess manageAccess;
    private final Clock clock;

    @Autowired
    public PublicVoteScheduleService(
            AuditionRepository auditionRepository,
            ApplicationRepository applicationRepository,
            AuditionVoteCandidateRepository candidates,
            AuditionManageAccess manageAccess) {
        this(auditionRepository, applicationRepository, candidates, manageAccess, Clock.systemUTC());
    }

    PublicVoteScheduleService(
            AuditionRepository auditionRepository,
            ApplicationRepository applicationRepository,
            AuditionVoteCandidateRepository candidates,
            AuditionManageAccess manageAccess,
            Clock clock) {
        this.auditionRepository = auditionRepository;
        this.applicationRepository = applicationRepository;
        this.candidates = candidates;
        this.manageAccess = manageAccess;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<Audition> listOpenVotes() {
        Instant now = clock.instant();
        return auditionRepository.findOpenPublicVotes(now).stream()
                .filter(a -> VoteWindow.isOpen(a, now))
                .filter(a -> VotingRoundPlan.enabledFor(a.getVotingRounds(),
                        a.getVoteRoundNumber() != null ? a.getVoteRoundNumber() : VotingRoundPlan.activeRound(a)))
                .filter(a -> candidates.countByAuditionIdAndRoundNumber(
                        a.getId(), effectiveRound(a)) >= 1)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VoteScheduleDto getSchedule(UUID auditionId) {
        Audition audition = manageAccess.requireReadableAudition(auditionId);
        Instant now = clock.instant();
        int round = VotingRoundPlan.activeRound(audition);
        VoteWindow.Phase phase = VoteWindow.phase(audition, now);
        List<UUID> ids = VoteWindow.hasStarted(phase)
                ? candidates.findByAuditionIdAndRoundNumber(auditionId, effectiveRound(audition)).stream()
                    .map(AuditionVoteCandidate::getApplicationId).toList()
                : currentVotable(audition, round).stream().map(Application::getId).toList();
        return toDto(audition, phase, ids);
    }

    @Transactional
    public VoteScheduleDto start(UUID auditionId, StartVoteRequest request) {
        Audition audition = manageAccess.requireManagedAudition(auditionId);
        Instant now = clock.instant();
        if (!VotingRoundPlan.enabledNow(audition)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이 회차는 공개 투표를 사용하지 않습니다.");
        }
        int round = VotingRoundPlan.activeRound(audition);
        VoteWindow.Phase current = VoteWindow.phase(audition, now);
        Integer startedRound = audition.getVoteRoundNumber();
        boolean sameRoundOpenOrClosed = (current == VoteWindow.Phase.OPEN || current == VoteWindow.Phase.CLOSED)
                && startedRound != null && startedRound == round;
        if (sameRoundOpenOrClosed) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 이 회차 투표를 시작했습니다.");
        }
        Instant startAt = parseInstant(request.getStartAt(), "startAt");
        Instant endAt = parseInstant(request.getEndAt(), "endAt");
        if (!endAt.isAfter(startAt)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "종료 시각은 시작 시각보다 뒤여야 합니다.");
        }
        if (!endAt.isAfter(now)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "종료 시각은 현재 시각보다 뒤여야 합니다.");
        }
        List<Application> chosen = resolveCandidates(audition, round, request.getApplicationIds());
        if (chosen.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "투표할 후보가 없습니다. 지원자를 심사·선발한 뒤 다시 시도하세요.");
        }
        candidates.deleteByAuditionIdAndRoundNumber(auditionId, round);
        Instant confirmed = now;
        int candidateNumber = 1;
        for (Application app : chosen) {
            AuditionVoteCandidate row = new AuditionVoteCandidate();
            row.setAuditionId(auditionId);
            row.setRoundNumber(round);
            row.setApplicationId(app.getId());
            row.setCandidateNumber(candidateNumber++);
            row.setConfirmedAt(confirmed);
            candidates.save(row);
        }
        audition.setVoteStartAt(startAt);
        audition.setVoteEndAt(endAt);
        audition.setVoteStartedAt(now);
        audition.setVoteRoundNumber(round);
        auditionRepository.save(audition);
        List<UUID> ids = chosen.stream().map(Application::getId).toList();
        return toDto(audition, VoteWindow.phase(audition, now), ids);
    }

    /**
     * 지원자 본인 공유 정보. 현재 시작된 회차 확정 명단에 있을 때만 candidate=true.
     * 지원만 했거나 시작 전 확정이 없으면 공유 링크를 주지 않는다.
     */
    @Transactional(readOnly = true)
    public MyVoteShareDto myVoteShare(UUID applicationId) {
        UUID me = SecurityUtils.getCurrentUserId();
        if (me == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        Application app = applicationRepository.findById(applicationId)
                .filter(a -> me.equals(a.getApplicantId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "지원을 찾을 수 없습니다."));
        MyVoteShareDto dto = new MyVoteShareDto();
        Audition audition = auditionRepository.findById(app.getAuditionId()).orElse(null);
        if (audition == null || audition.getVoteRoundNumber() == null) {
            return dto;
        }
        int round = audition.getVoteRoundNumber();
        VoteWindow.Phase phase = VoteWindow.phase(audition, clock.instant());
        if (!VoteWindow.hasStarted(phase)
                || !candidates.existsByAuditionIdAndRoundNumberAndApplicationId(audition.getId(), round, app.getId())) {
            return dto;
        }
        dto.setCandidateNumber(candidates.findByAuditionIdAndRoundNumber(audition.getId(), round).stream()
                .filter(c -> c.getApplicationId().equals(app.getId())).map(AuditionVoteCandidate::getCandidateNumber).findFirst().orElse(null));
        dto.setCandidate(true);
        dto.setAuditionId(audition.getId().toString());
        dto.setAuditionTitle(audition.getTitle());
        dto.setApplicationId(app.getId().toString());
        dto.setRoundNumber(round);
        dto.setVoteStatus(phase.name());
        dto.setVoteStartAt(audition.getVoteStartAt());
        dto.setVoteEndAt(audition.getVoteEndAt());
        return dto;
    }

    private List<Application> resolveCandidates(Audition audition, int round, List<String> requested) {
        List<Application> votable = currentVotable(audition, round);
        if (requested == null || requested.stream().noneMatch(StringUtils::hasText)) {
            return votable;
        }
        Set<UUID> want = new LinkedHashSet<>();
        for (String raw : requested) {
            if (!StringUtils.hasText(raw)) {
                continue;
            }
            try {
                want.add(UUID.fromString(raw.trim()));
            } catch (IllegalArgumentException ex) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효하지 않은 applicationId입니다.");
            }
        }
        Set<UUID> allowed = votable.stream().map(Application::getId).collect(Collectors.toSet());
        List<Application> out = new ArrayList<>();
        for (UUID id : want) {
            if (!allowed.contains(id)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이번 회차 투표 대상이 아닌 지원이 포함되어 있습니다.");
            }
            votable.stream().filter(a -> a.getId().equals(id)).findFirst().ifPresent(out::add);
        }
        return out;
    }

    List<Application> currentVotable(Audition audition, int round) {
        return applicationRepository.findByAuditionIdAndStatusInOrderByCreatedAtDesc(audition.getId(), LISTABLE_STATUSES)
                .stream()
                .filter(app -> VotingRoundPlan.isRoundCandidate(audition, app, round))
                .collect(Collectors.toList());
    }

    static Instant parseInstant(String raw, String field) {
        if (!StringUtils.hasText(raw)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, field + " 이(가) 필요합니다.");
        }
        try {
            return Instant.parse(raw.trim());
        } catch (DateTimeParseException ex) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, field + " 형식이 올바르지 않습니다.");
        }
    }

    private static int effectiveRound(Audition audition) {
        return audition.getVoteRoundNumber() != null
                ? audition.getVoteRoundNumber()
                : VotingRoundPlan.activeRound(audition);
    }

    private static VoteScheduleDto toDto(Audition audition, VoteWindow.Phase phase, List<UUID> ids) {
        VoteScheduleDto dto = new VoteScheduleDto();
        dto.setVoteStatus(phase.name());
        dto.setRoundNumber(effectiveRound(audition));
        dto.setVoteStartAt(audition.getVoteStartAt());
        dto.setVoteEndAt(audition.getVoteEndAt());
        dto.setVoteStartedAt(audition.getVoteStartedAt());
        dto.setCandidateCount(ids.size());
        dto.setCandidateApplicationIds(ids.stream().map(UUID::toString).toList());
        return dto;
    }
}
