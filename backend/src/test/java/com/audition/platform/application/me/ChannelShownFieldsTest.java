package com.audition.platform.application.me;

import com.audition.platform.api.dto.channel.PublicChannelResponse;
import com.audition.platform.domain.user.User;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ChannelShownFieldsTest {

    @Test
    void legacyPublicKeepsPreviousFieldsAndHidesNewCareer() {
        assertTrue(ChannelShownFields.visible(null, ChannelShownFields.BIO));
        assertTrue(ChannelShownFields.visible(null, ChannelShownFields.SPECIALTIES));
        assertFalse(ChannelShownFields.visible(null, ChannelShownFields.CAREER));
        assertFalse(ChannelShownFields.visible(null, ChannelShownFields.ACTIVITY));
    }

    @Test
    void emptySelectionPublishesNoProfileFields() {
        assertFalse(ChannelShownFields.visible(new String[0], ChannelShownFields.BIO));
        assertEquals(List.of(), ChannelShownFields.effective(new String[0]));
    }

    @Test
    void normalizeRejectsUnknownKeysAndDropsBlanks() {
        assertEquals(List.of(ChannelShownFields.CAREER),
                List.of(ChannelShownFields.normalize(List.of(" career ", ""))));
        assertThrows(IllegalArgumentException.class, () -> ChannelShownFields.normalize(List.of("NICKNAME")));
    }

    @Test
    void publicReadOmitsUnselectedCareerAndKeepsChannelIntro() {
        User user = new User();
        user.setCareerText("서울 연습생 3년");
        user.setActivityFields(new String[] { "보컬" });
        user.setBio("긴 소개");
        user.setChannelShownFields(new String[] { ChannelShownFields.CAREER });
        PublicChannelResponse out = new PublicChannelResponse();
        out.setBio("긴 소개");
        out.setName("실명");
        out.setChannelDescription("채널 소개");
        out.setCategories(List.of("댄스"));
        PublicChannelProfileFilter.apply(out, user);
        assertEquals("서울 연습생 3년", out.getCareerText());
        assertEquals(List.of(), out.getActivityFields());
        assertEquals(null, out.getBio());
        assertEquals(null, out.getName());
        assertEquals(List.of(), out.getCategories());
        assertEquals("채널 소개", out.getChannelDescription());
        assertTrue(out.isSelectionCustomized());
    }

    @Test
    void activityFieldsRejectOverflow() {
        assertThrows(IllegalArgumentException.class,
                () -> ProfileActivityFields.normalize(List.of("a", "b", "c", "d", "e", "f", "g", "h", "i")));
        assertEquals(List.of("보컬"), List.of(ProfileActivityFields.normalize(List.of(" 보컬 ", ""))));
    }

    @Test
    void brokenNotificationPayloadDoesNotInventText() {
        assertEquals("", NotificationPayloadText.text("{", "title"));
        assertEquals("합격", NotificationPayloadText.text("{\"title\":\"합격\",\"body\":\"다음\"}", "title"));
        assertEquals("다음", NotificationPayloadText.text("{\"title\":\"합격\",\"body\":\"다음\"}", "body"));
    }
}
