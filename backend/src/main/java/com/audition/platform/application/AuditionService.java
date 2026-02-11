package com.audition.platform.application;

import com.audition.platform.api.dto.AuditionResponse;
import com.audition.platform.api.dto.CreateAuditionRequest;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.user.UserRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
        r.setCreatedAt(a.getCreatedAt());
        return r;
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
        a = auditionRepository.save(a);
        return toResponse(a);
    }

    public List<AuditionResponse> list() {
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
}
