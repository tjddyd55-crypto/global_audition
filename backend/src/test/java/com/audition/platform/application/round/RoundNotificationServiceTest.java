package com.audition.platform.application.round;

import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRoundNotification;
import com.audition.platform.domain.audition.AuditionRoundNotificationRepository;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RoundNotificationServiceTest {

    private AuditionRoundNotificationRepository notifications;
    private UserRepository users;
    private RoundNotificationService service;

    @BeforeEach
    void setUp() {
        notifications = mock(AuditionRoundNotificationRepository.class);
        users = mock(UserRepository.class);
        service = new RoundNotificationService(notifications, users);
    }

    @Test
    void singleStageAcceptWritesOneInAppNoticeWithoutARound() {
        Application application = application();
        User applicant = new User();
        applicant.setEmail("applicant@example.com");
        when(users.findById(application.getApplicantId())).thenReturn(Optional.of(applicant));
        when(notifications.existsByApplicationIdAndNotificationTypeAndChannelAndRoundIdIsNull(
                application.getId(), "PASS_NOTICE", "IN_APP")).thenReturn(false);

        service.logSingleStageDecision(application, audition("SINGLE"), "ACCEPTED");

        ArgumentCaptor<AuditionRoundNotification> saved = ArgumentCaptor.forClass(AuditionRoundNotification.class);
        verify(notifications).save(saved.capture());
        AuditionRoundNotification notice = saved.getValue();
        assertNull(notice.getRoundId());
        assertEquals(application.getId(), notice.getApplicationId());
        assertEquals(application.getAuditionId(), notice.getAuditionId());
        assertEquals("PASS_NOTICE", notice.getNotificationType());
        assertEquals("IN_APP", notice.getChannel());
        assertEquals("applicant@example.com", notice.getTargetEmail());
        assertEquals("singleStageResultTitle", notice.getPayloadJson().get("titleKey"));
        assertEquals("singleStagePassBody", notice.getPayloadJson().get("bodyKey"));
        assertEquals("ACCEPTED", notice.getPayloadJson().get("result"));
    }

    @Test
    void repeatingTheSameResultDoesNotInsertAgain() {
        Application application = application();
        when(notifications.existsByApplicationIdAndNotificationTypeAndChannelAndRoundIdIsNull(
                application.getId(), "FAIL_NOTICE", "IN_APP")).thenReturn(true);

        service.logSingleStageDecision(application, audition("SINGLE"), "REJECTED");

        verify(notifications, never()).save(any());
    }

    @Test
    void multiRoundDecisionAndNonResultStatusDoNotNotify() {
        Application application = application();

        service.logSingleStageDecision(application, audition("MULTI_ROUND"), "ACCEPTED");
        service.logSingleStageDecision(application, audition("SINGLE"), "REVIEWING");

        verify(notifications, never()).existsByApplicationIdAndNotificationTypeAndChannelAndRoundIdIsNull(any(), any(), any());
        verify(notifications, never()).save(any());
    }

    private static Application application() {
        Application application = new Application();
        application.setId(UUID.randomUUID());
        application.setAuditionId(UUID.randomUUID());
        application.setApplicantId(UUID.randomUUID());
        return application;
    }

    private static Audition audition(String processMode) {
        Audition audition = new Audition();
        audition.setId(UUID.randomUUID());
        audition.setProcessMode(processMode);
        return audition;
    }
}
