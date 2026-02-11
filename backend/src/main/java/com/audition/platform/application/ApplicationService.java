package com.audition.platform.application;

import com.audition.platform.api.dto.ApplicationResponse;
import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.user.User;
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
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final AuditionRepository auditionRepository;
    private final UserRepository userRepository;

    public ApplicationService(ApplicationRepository applicationRepository,
                              AuditionRepository auditionRepository,
                              UserRepository userRepository) {
        this.applicationRepository = applicationRepository;
        this.auditionRepository = auditionRepository;
        this.userRepository = userRepository;
    }

    private static ApplicationResponse toResponse(Application app, User applicant) {
        ApplicationResponse r = new ApplicationResponse();
        r.setId(app.getId());
        r.setAuditionId(app.getAuditionId());
        r.setApplicantId(app.getApplicantId());
        r.setApplicantEmail(applicant != null ? applicant.getEmail() : null);
        r.setStatus(app.getStatus());
        r.setCreatedAt(app.getCreatedAt());
        return r;
    }

    @Transactional
    public ApplicationResponse apply(UUID auditionId) {
        UUID applicantId = SecurityUtils.getCurrentUserId();
        if (applicantId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        if (!SecurityUtils.hasRole("APPLICANT") && !SecurityUtils.hasRole("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only APPLICANT can apply");
        }
        Audition audition = auditionRepository.findById(auditionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Audition not found"));
        if (!"OPEN".equals(audition.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Audition is not open for applications");
        }
        if (applicationRepository.existsByAuditionIdAndApplicantId(auditionId, applicantId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Already applied to this audition");
        }
        User applicant = userRepository.findById(applicantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "User not found"));
        Application app = new Application();
        app.setAuditionId(auditionId);
        app.setApplicantId(applicantId);
        app.setStatus("SUBMITTED");
        app = applicationRepository.save(app);
        return toResponse(app, applicant);
    }

    public List<ApplicationResponse> listMyApplications() {
        UUID applicantId = SecurityUtils.getCurrentUserId();
        if (applicantId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        List<Application> list = applicationRepository.findByApplicantIdOrderByCreatedAtDesc(applicantId);
        return list.stream()
                .map(app -> {
                    Audition a = auditionRepository.findById(app.getAuditionId()).orElse(null);
                    User applicant = userRepository.findById(app.getApplicantId()).orElse(null);
                    ApplicationResponse r = toResponse(app, applicant);
                    if (a != null) {
                        r.setAuditionTitle(a.getTitle());
                    }
                    return r;
                })
                .collect(Collectors.toList());
    }

    public List<ApplicationResponse> listByAudition(UUID auditionId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        Audition audition = auditionRepository.findById(auditionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Audition not found"));
        if (!audition.getOwnerId().equals(currentUserId) && !SecurityUtils.hasRole("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only audition owner can list applications");
        }
        List<Application> list = applicationRepository.findByAuditionIdOrderByCreatedAtDesc(auditionId);
        return list.stream()
                .map(app -> {
                    User applicant = userRepository.findById(app.getApplicantId()).orElse(null);
                    return toResponse(app, applicant);
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public ApplicationResponse accept(UUID applicationId) {
        return updateStatus(applicationId, "ACCEPTED");
    }

    @Transactional
    public ApplicationResponse reject(UUID applicationId) {
        return updateStatus(applicationId, "REJECTED");
    }

    @Transactional
    public ApplicationResponse updateStatus(UUID applicationId, String newStatus) {
        if (!"REVIEWED".equals(newStatus) && !"ACCEPTED".equals(newStatus) && !"REJECTED".equals(newStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status must be REVIEWED, ACCEPTED, or REJECTED");
        }
        return updateDecision(applicationId, newStatus);
    }

    private ApplicationResponse updateDecision(UUID applicationId, String newStatus) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));
        Audition audition = auditionRepository.findById(app.getAuditionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Audition not found"));
        if (!audition.getOwnerId().equals(currentUserId) && !SecurityUtils.hasRole("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only audition owner can accept/reject");
        }
        app.setStatus(newStatus);
        app = applicationRepository.save(app);
        User applicant = userRepository.findById(app.getApplicantId()).orElse(null);
        return toResponse(app, applicant);
    }
}
