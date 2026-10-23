package com.audition.platform.application.me;

import com.audition.platform.api.dto.channel.PublicChannelResponse;
import com.audition.platform.domain.user.User;

import java.util.Arrays;
import java.util.List;

/** 공개 채널 읽기 모델. 채널 소개·배너·영상은 유지하고 프로필 항목만 선택 키로 거른다. */
public final class PublicChannelProfileFilter {

    private PublicChannelProfileFilter() {
    }

    public static void apply(PublicChannelResponse out, User user) {
        String[] shown = user.getChannelShownFields();
        out.setShownFields(ChannelShownFields.effective(shown));
        out.setSelectionCustomized(shown != null);
        if (!ChannelShownFields.visible(shown, ChannelShownFields.NAME)) {
            out.setName(null);
        }
        if (!ChannelShownFields.visible(shown, ChannelShownFields.INTRO)) {
            out.setIntroText(null);
        }
        if (!ChannelShownFields.visible(shown, ChannelShownFields.NATIONALITY)) {
            out.setNationality(null);
        }
        if (!ChannelShownFields.visible(shown, ChannelShownFields.SHORT_BIO)) {
            out.setShortBio(null);
        }
        if (!ChannelShownFields.visible(shown, ChannelShownFields.BIO)) {
            out.setBio(null);
        }
        if (!ChannelShownFields.visible(shown, ChannelShownFields.SPECIALTIES)) {
            out.setCategories(List.of());
        }
        if (!ChannelShownFields.visible(shown, ChannelShownFields.SNS)) {
            out.setSnsLinks(List.of());
        }
        if (ChannelShownFields.visible(shown, ChannelShownFields.CAREER)) {
            out.setCareerText(trimToNull(user.getCareerText()));
        } else {
            out.setCareerText(null);
        }
        if (ChannelShownFields.visible(shown, ChannelShownFields.ACTIVITY)) {
            String[] activity = user.getActivityFields();
            out.setActivityFields(activity != null && activity.length > 0 ? Arrays.asList(activity) : List.of());
        } else {
            out.setActivityFields(List.of());
        }
    }

    private static String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
