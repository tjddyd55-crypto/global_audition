package com.audition.platform.application.i18n.content;

import com.audition.platform.application.i18n.content.ContentTranslationRows.ContentSnapshot;
import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.ApplicationVideo;
import com.audition.platform.domain.audition.ApplicationVideoRepository;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.audition.AuditionRound;
import com.audition.platform.domain.audition.AuditionRoundRepository;
import com.audition.platform.domain.channel.ChannelSubscriptionRepository;
import com.audition.platform.domain.channel.ChannelVideo;
import com.audition.platform.domain.channel.ChannelVideoRepository;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ContentSourceAccessTest {

    private final UUID applicantId = UUID.randomUUID();
    private final UUID agencyId = UUID.randomUUID();
    private final UUID strangerId = UUID.randomUUID();
    private final UUID otherAgencyId = UUID.randomUUID();
    private final UUID adminId = UUID.randomUUID();
    private final UUID contentId = UUID.randomUUID();
    private final UUID auditionId = UUID.randomUUID();

    @Mock private ApplicationRepository applications;
    @Mock private AuditionRepository auditions;
    @Mock private UserRepository users;
    @Mock private ApplicationVideoRepository applicationVideos;
    @Mock private ChannelVideoRepository channelVideos;
    @Mock private ChannelSubscriptionRepository subscriptions;
    @Mock private AuditionRoundRepository rounds;

    private ContentAccess access;

    @BeforeEach
    void setUp() {
        access = new ContentAccess(users, applications);
        lenient().when(users.findById(any())).thenReturn(Optional.empty());
    }

    @Test
    void applicationIntroIsVisibleOnlyToApplicantAgencyAndStaff() {
        ApplicationIntroSource source = new ApplicationIntroSource(applications, auditions, access);
        Application application = new Application();
        application.setId(contentId);
        application.setApplicantId(applicantId);
        application.setAuditionId(auditionId);
        application.setIntroText("연습생입니다");
        Audition audition = new Audition();
        audition.setId(auditionId);
        audition.setOwnerId(agencyId);
        when(applications.findById(contentId)).thenReturn(Optional.of(application));
        when(auditions.findById(auditionId)).thenReturn(Optional.of(audition));
        when(users.findById(adminId)).thenReturn(Optional.of(user(adminId, "ADMIN", false)));

        ContentSnapshot snapshot = source.load(contentId).orElseThrow();
        assertTrue(source.canRead(snapshot, applicantId));
        assertTrue(source.canRead(snapshot, agencyId));
        assertTrue(source.canRead(snapshot, adminId));
        assertFalse(source.canRead(snapshot, strangerId));
        assertFalse(source.canRead(snapshot, otherAgencyId));
        assertFalse(source.canRead(snapshot, null));
    }

    @Test
    void privateUserIntroStaysHiddenFromAnUnrelatedAgency() {
        UserIntroSource source = new UserIntroSource(users, access);
        User applicant = user(applicantId, "APPLICANT", false);
        applicant.setIntroText("자기소개");
        when(users.findById(applicantId)).thenReturn(Optional.of(applicant));
        when(applications.existsForApplicantAndAgency(applicantId, agencyId)).thenReturn(true);
        when(applications.existsForApplicantAndAgency(applicantId, otherAgencyId)).thenReturn(false);

        ContentSnapshot snapshot = source.load(applicantId).orElseThrow();
        assertTrue(source.canRead(snapshot, applicantId));
        assertTrue(source.canRead(snapshot, agencyId));
        assertFalse(source.canRead(snapshot, otherAgencyId));
        assertFalse(source.canRead(snapshot, null));
    }

    @Test
    void publicChannelIntroIsReadableWithoutALogin() {
        UserIntroSource source = new UserIntroSource(users, access);
        when(users.findById(applicantId)).thenReturn(Optional.of(user(applicantId, "APPLICANT", true)));
        ContentSnapshot snapshot = source.load(applicantId).orElseThrow();
        assertTrue(source.canRead(snapshot, null));
    }

    @Test
    void agencyProfileRequiresTheAgencyRoleAndAPublicChannel() {
        AgencyProfileSource source = new AgencyProfileSource(users, access);
        User applicant = user(applicantId, "APPLICANT", true);
        User agency = user(agencyId, "AGENCY", false);
        agency.setBio("기획사");
        when(users.findById(applicantId)).thenReturn(Optional.of(applicant));
        when(users.findById(agencyId)).thenReturn(Optional.of(agency));

        assertTrue(source.load(applicantId).isEmpty());
        ContentSnapshot hidden = source.load(agencyId).orElseThrow();
        assertFalse(source.canRead(hidden, null));
        assertTrue(source.canRead(hidden, agencyId));

        agency.setChannelPublic(true);
        assertTrue(source.canRead(source.load(agencyId).orElseThrow(), null));
    }

    @Test
    void privateChannelVideoIsOwnerOnlyAndPublicVideoIsOpen() {
        ChannelVideoTextSource source = new ChannelVideoTextSource(channelVideos, users, subscriptions, access);
        ChannelVideo video = new ChannelVideo();
        video.setId(contentId);
        video.setOwnerId(applicantId);
        video.setTitle("제목");
        video.setVisibility("PRIVATE");
        when(channelVideos.findById(contentId)).thenReturn(Optional.of(video));
        when(users.findById(applicantId)).thenReturn(Optional.of(user(applicantId, "APPLICANT", true)));

        ContentSnapshot snapshot = source.load(contentId).orElseThrow();
        assertTrue(source.canRead(snapshot, applicantId));
        assertFalse(source.canRead(snapshot, strangerId));

        video.setVisibility("PUBLIC");
        assertTrue(source.canRead(snapshot, null));
    }

    @Test
    void applicationVideoTitleFollowsListableStatus() {
        ApplicationVideoTitleSource source = new ApplicationVideoTitleSource(applicationVideos, applications, auditions, access);
        ApplicationVideo video = new ApplicationVideo();
        video.setId(contentId);
        video.setApplicationId(UUID.randomUUID());
        video.setTitle("지원 영상");
        Application application = new Application();
        application.setId(video.getApplicationId());
        application.setApplicantId(applicantId);
        application.setAuditionId(auditionId);
        application.setStatus("DRAFT");
        Audition audition = new Audition();
        audition.setId(auditionId);
        audition.setOwnerId(agencyId);
        when(applicationVideos.findById(contentId)).thenReturn(Optional.of(video));
        when(applications.findById(video.getApplicationId())).thenReturn(Optional.of(application));
        when(auditions.findById(auditionId)).thenReturn(Optional.of(audition));

        ContentSnapshot snapshot = source.load(contentId).orElseThrow();
        assertTrue(snapshot.fields().containsKey("title"));
        assertFalse(snapshot.fields().containsKey("description"));
        assertFalse(source.canRead(snapshot, strangerId));
        assertTrue(source.canRead(snapshot, applicantId));
        application.setStatus("SUBMITTED");
        assertTrue(source.canRead(snapshot, null));
    }

    @Test
    void draftRoundNoticeIsHiddenAndOpenRoundNoticeIsPublic() {
        AuditionRoundNoticeSource source = new AuditionRoundNoticeSource(rounds, auditions, access);
        AuditionRound round = new AuditionRound();
        round.setId(contentId);
        round.setAuditionId(auditionId);
        round.setRoundName("1차");
        round.setAnnouncementBody("안내");
        Audition audition = new Audition();
        audition.setId(auditionId);
        audition.setOwnerId(agencyId);
        audition.setStatus("DRAFT");
        when(rounds.findById(contentId)).thenReturn(Optional.of(round));
        when(auditions.findById(auditionId)).thenReturn(Optional.of(audition));

        ContentSnapshot snapshot = source.load(contentId).orElseThrow();
        assertFalse(source.canRead(snapshot, null));
        assertTrue(source.canRead(snapshot, agencyId));
        audition.setStatus("OPEN");
        assertTrue(source.canRead(snapshot, null));
    }

    private static User user(UUID id, String role, boolean channelPublic) {
        User user = new User();
        user.setId(id);
        user.setRole(role);
        user.setChannelPublic(channelPublic);
        return user;
    }
}
