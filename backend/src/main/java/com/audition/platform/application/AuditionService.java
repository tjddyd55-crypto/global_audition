package com.audition.platform.application;

import com.audition.platform.api.dto.AuditionResponse;
import com.audition.platform.api.dto.CreateAuditionRequest;
import com.audition.platform.api.dto.UpdateAuditionRequest;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.user.UserRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuditionService {

    private final AuditionRepository auditionRepository;
    private final UserRepository userRepository;

    public AuditionService(AuditionRepository auditionRepository, UserRepository userRepository) {
        this.auditionRepository = auditionRepository;
        this.userRepository = userRepository;
    }

    private static AuditionResponse toResponse(Audition a) {
        AuditionResponse r = new AuditionResponse();
        r.setId(a.getId());
        r.setOwnerId(a.getOwnerId());
        r.setTitle(a.getTitle());
        r.setDescription(a.getDescription());
        r.setStatus(a.getStatus());
        r.setUpdatedAt(a.getUpdatedAt());
        r.setCountryCode(a.getCountryCode());
        r.setDeadlineAt(a.getDeadlineAt());
        r.setCategory(a.getCategory());
        r.setCreatedAt(a.getCreatedAt());
        return r;
    }

    private static Instant parseInstantOrNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Instant.parse(value);
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "deadlineAt must be ISO-8601 datetime");
        }
    }

    @Transactional
    public AuditionResponse create(CreateAuditionRequest req) {
        UUID ownerId = SecurityUtils.getCurrentUserId();
        if (ownerId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        if (!SecurityUtils.hasRole("AGENCY") && !SecurityUtils.hasRole("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only AGENCY or ADMIN can create auditions");
        }
        if (!userRepository.existsById(ownerId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User not found");
        }
        Audition a = new Audition();
        a.setOwnerId(ownerId);
        a.setTitle(req.getTitle().trim());
        a.setDescription(req.getDescription() != null ? req.getDescription().trim() : null);
        a.setStatus(req.getStatus() != null ? req.getStatus() : "DRAFT");
        a.setCountryCode(req.getCountryCode());
        a.setCategory(req.getCategory());
        a.setDeadlineAt(parseInstantOrNull(req.getDeadlineAt()));
        a.setUpdatedAt(Instant.now());
        a = auditionRepository.save(a);
        return toResponse(a);
    }

    public List<AuditionResponse> listOpen() {
        return auditionRepository.findByStatusOrderByCreatedAtDesc("OPEN").stream()
                .map(AuditionService::toResponse)
                .collect(Collectors.toList());
    }

    public List<AuditionResponse> listByStatus(String status) {
        return auditionRepository.findByStatusOrderByCreatedAtDesc(status).stream()
                .map(AuditionService::toResponse)
                .collect(Collectors.toList());
    }

    public List<AuditionResponse> listAll() {
        return auditionRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(AuditionService::toResponse)
                .collect(Collectors.toList());
    }

    public List<AuditionResponse> listMine() {
        UUID ownerId = SecurityUtils.getCurrentUserId();
        if (ownerId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        if (!SecurityUtils.hasRole("AGENCY") && !SecurityUtils.hasRole("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only AGENCY or ADMIN can list own auditions");
        }
        return auditionRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId).stream()
                .map(AuditionService::toResponse)
                .collect(Collectors.toList());
    }

    public AuditionResponse getById(UUID id) {
        Audition a = auditionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Audition not found"));
        return toResponse(a);
    }

    @Transactional
    public AuditionResponse update(UUID id, UpdateAuditionRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        Audition audition = auditionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Audition not found"));

        if (!SecurityUtils.hasRole("ADMIN") && !audition.getOwnerId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only owner or ADMIN can update this audition");
        }

        if (request.getTitle() != null) {
            audition.setTitle(request.getTitle().trim());
        }
        if (request.getDescription() != null) {
            audition.setDescription(request.getDescription().trim());
        }
        if (request.getStatus() != null) {
            audition.setStatus(request.getStatus());
        }
        if (request.getCountryCode() != null) {
            audition.setCountryCode(request.getCountryCode());
        }
        if (request.getCategory() != null) {
            audition.setCategory(request.getCategory());
        }
        if (request.getDeadlineAt() != null) {
            audition.setDeadlineAt(parseInstantOrNull(request.getDeadlineAt()));
        }
        audition.setUpdatedAt(Instant.now());
        return toResponse(auditionRepository.save(audition));
    }

    public void delete(UUID id) {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        Audition audition = auditionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Audition not found"));
        if (!SecurityUtils.hasRole("ADMIN") && !audition.getOwnerId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only owner or ADMIN can delete this audition");
        }
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Audition delete is not supported yet");
    }
}
