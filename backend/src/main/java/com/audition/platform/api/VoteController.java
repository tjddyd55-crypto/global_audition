package com.audition.platform.api;

import com.audition.platform.api.dto.ApiEnvelope;
import com.audition.platform.api.dto.CastVoteRequest;
import com.audition.platform.api.dto.MyVoteShareDto;
import com.audition.platform.api.dto.PublicVotePageDataDto;
import com.audition.platform.api.dto.StartVoteRequest;
import com.audition.platform.api.dto.VoteMutationResultDto;
import com.audition.platform.api.dto.VoteScheduleDto;
import com.audition.platform.application.vote.PublicVoteScheduleService;
import com.audition.platform.application.vote.PublicVoteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/api")
public class VoteController {

    private final PublicVoteService publicVoteService;
    private final PublicVoteScheduleService publicVoteScheduleService;

    public VoteController(PublicVoteService publicVoteService, PublicVoteScheduleService publicVoteScheduleService) {
        this.publicVoteService = publicVoteService;
        this.publicVoteScheduleService = publicVoteScheduleService;
    }

    @GetMapping("/auditions/{auditionId}/votes")
    public ApiEnvelope<PublicVotePageDataDto> listVotes(
            @PathVariable UUID auditionId,
            @RequestParam(name = "category", required = false) String category,
            @RequestParam(name = "round", required = false) Integer round,
            @RequestParam(name = "candidate", required = false) String candidate) {
        UUID candidateId = null;
        if (candidate != null && !candidate.isBlank()) {
            try {
                candidateId = UUID.fromString(candidate.trim());
            } catch (IllegalArgumentException ignored) {
                // 잘못된 후보 식별자는 무시하고 전체 화면만 보여 준다(다른 정보는 내보내지 않는다).
            }
        }
        return ApiEnvelope.ok(publicVoteService.getPublicVotes(auditionId, category, round, candidateId));
    }

    @GetMapping("/auditions/{auditionId}/votes/schedule")
    public ApiEnvelope<VoteScheduleDto> getVoteSchedule(@PathVariable UUID auditionId) {
        return ApiEnvelope.ok(publicVoteScheduleService.getSchedule(auditionId));
    }

    @GetMapping("/me/applications/{applicationId}/vote-share")
    public ApiEnvelope<MyVoteShareDto> myVoteShare(@PathVariable UUID applicationId) {
        return ApiEnvelope.ok(publicVoteScheduleService.myVoteShare(applicationId));
    }

    @PostMapping("/auditions/{auditionId}/votes/start")
    public ApiEnvelope<VoteScheduleDto> startVote(
            @PathVariable UUID auditionId,
            @Valid @RequestBody StartVoteRequest body) {
        return ApiEnvelope.ok(publicVoteScheduleService.start(auditionId, body));
    }

    @PostMapping("/votes")
    public ApiEnvelope<VoteMutationResultDto> castVote(@Valid @RequestBody CastVoteRequest body) {
        UUID auditionId;
        UUID applicationId;
        try {
            auditionId = UUID.fromString(body.getAuditionId().trim());
            applicationId = UUID.fromString(body.getApplicationId().trim());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효하지 않은 auditionId 또는 applicationId입니다.");
        }
        return ApiEnvelope.ok(publicVoteService.castVote(auditionId, applicationId));
    }

    @DeleteMapping("/votes/{applicationId}")
    public ApiEnvelope<Boolean> removeVote(@PathVariable UUID applicationId) {
        publicVoteService.removeVote(applicationId);
        return ApiEnvelope.ok(Boolean.TRUE);
    }
}
