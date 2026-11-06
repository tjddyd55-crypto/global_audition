package com.audition.platform.application.me;

import com.audition.platform.application.i18n.AuditionLocalizationService;
import com.audition.platform.application.i18n.ContentLocaleResolver;
import com.audition.platform.application.round.AuditionRoundService;
import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.ApplicationSnsLinkRepository;
import com.audition.platform.domain.audition.ApplicationVideoRepository;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MeApplicationListTitleTest {

    @AfterEach
    void clearSecurity() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void listUsesSelectedLocaleTitleInsteadOfKoreanOriginal() {
        UUID userId = UUID.randomUUID();
        UUID auditionId = UUID.randomUUID();
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                userId, "n/a", List.of(new SimpleGrantedAuthority("ROLE_APPLICANT"))));

        ApplicationRepository applications = mock(ApplicationRepository.class);
        AuditionRepository auditions = mock(AuditionRepository.class);
        AuditionLocalizationService localization = mock(AuditionLocalizationService.class);
        ContentLocaleResolver locales = mock(ContentLocaleResolver.class);
        MeApplicationService service = new MeApplicationService(
                applications,
                mock(ApplicationVideoRepository.class),
                mock(ApplicationSnsLinkRepository.class),
                auditions,
                mock(AuditionRoundService.class),
                localization,
                locales);

        Audition audition = new Audition();
        audition.setId(auditionId);
        audition.setTitle("서울 오디션");
        audition.setDefaultLocale("ko");
        Application application = new Application();
        application.setId(UUID.randomUUID());
        application.setAuditionId(auditionId);
        application.setApplicantId(userId);
        application.setStatus("SUBMITTED");
        application.setCreatedAt(Instant.parse("2026-10-01T00:00:00Z"));

        when(locales.resolve()).thenReturn("en");
        when(applications.findByApplicantIdOrderByCreatedAtDesc(userId)).thenReturn(List.of(application));
        when(auditions.findById(auditionId)).thenReturn(Optional.of(audition));
        when(localization.titleForViewer(audition, "en")).thenReturn("Seoul open call");

        var page = service.listApplications();

        assertEquals("Seoul open call", page.getItems().get(0).getAuditionTitle());
        assertEquals("서울 오디션", audition.getTitle());
        verify(localization).titleForViewer(audition, "en");
    }
}
