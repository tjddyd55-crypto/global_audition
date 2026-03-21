package com.audition.platform.api;

import com.audition.platform.api.dto.ApiEnvelope;
import com.audition.platform.api.dto.AuditionPublicVotesDataDto;
import com.audition.platform.api.dto.CastVoteRequest;
import com.audition.platform.api.dto.VoteMutationResultDto;
import com.audition.platform.application.vote.PublicVoteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/api")
public class VoteController {

    private final PublicVoteService publicVoteService;

    public VoteController(PublicVoteService publicVoteService) {
        this.publicVoteService = publicVoteService;
    }

    @GetMapping("/auditions/{auditionId}/votes")
    public ApiEnvelope<AuditionPublicVotesDataDto> listVotes(@PathVariable UUID auditionId) {
        return ApiEnvelope.ok(publicVoteService.getPublicVotes(auditionId));
    }

    @PostMapping("/votes")
    public ApiEnvelope<VoteMutationResultDto> castVote(@Valid @RequestBody CastVoteRequest body) {
        UUID applicationId;
        try {
            applicationId = UUID.fromString(body.getApplicationId().trim());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효하지 않은 applicationId입니다.");
        }
        return ApiEnvelope.ok(publicVoteService.castVote(applicationId));
    }

    @DeleteMapping("/votes/{applicationId}")
    public ApiEnvelope<Boolean> removeVote(@PathVariable UUID applicationId) {
        publicVoteService.removeVote(applicationId);
        return ApiEnvelope.ok(Boolean.TRUE);
    }
}
