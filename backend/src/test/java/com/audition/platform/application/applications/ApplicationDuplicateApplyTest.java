package com.audition.platform.application.applications;

import com.audition.platform.api.dto.CreateApplicationRequest;
import com.audition.platform.application.ApplicationService;
import com.audition.platform.application.audition.AuditionSeriesEligibilityService;
import com.audition.platform.application.credit.CreditService;
import com.audition.platform.application.round.ApplicationRoundSubmissionService;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.ApplicationSnsLinkRepository;
import com.audition.platform.domain.audition.ApplicationVideoRepository;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.user.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ApplicationDuplicateApplyTest {

    @AfterEach
    void clearSecurity() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void duplicateApplyConflictUsesCatalogKey() {
        UUID userId = UUID.randomUUID();
        UUID auditionId = UUID.randomUUID();
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                userId, "n/a", List.of(new SimpleGrantedAuthority("ROLE_APPLICANT"))));

        ApplicationRepository applications = mock(ApplicationRepository.class);
        AuditionRepository auditions = mock(AuditionRepository.class);
        AuditionSeriesEligibilityService eligibility = mock(AuditionSeriesEligibilityService.class);
        ApplicationSubmitService service = new ApplicationSubmitService(
                mock(ApplicationService.class),
                applications,
                auditions,
                mock(UserRepository.class),
                mock(ApplicationVideoRepository.class),
                mock(ApplicationSnsLinkRepository.class),
                mock(CreditService.class),
                mock(ApplicationRoundSubmissionService.class),
                eligibility,
                mock(ApplicationValidationService.class));

        Audition audition = new Audition();
        audition.setId(auditionId);
        audition.setStatus("OPEN");
        when(auditions.findById(auditionId)).thenReturn(Optional.of(audition));
        when(eligibility.canApply(userId, audition)).thenReturn(true);
        when(applications.existsByAuditionIdAndApplicantId(auditionId, userId)).thenReturn(true);

        CreateApplicationRequest body = new CreateApplicationRequest();
        body.setAuditionId(auditionId);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.submitApplication(body));

        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        assertEquals(ApplicationSubmitService.ALREADY_APPLIED, ex.getReason());
    }
}
