package com.audition.platform.application.i18n.content;

import com.audition.platform.application.i18n.content.ContentTranslationRows.ContentSnapshot;
import com.audition.platform.domain.channel.ChannelSubscriptionRepository;
import com.audition.platform.domain.channel.ChannelVideo;
import com.audition.platform.domain.channel.ChannelVideoRepository;
import com.audition.platform.domain.channel.ChannelVideoVisibility;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Component
public class ChannelVideoTextSource implements ContentTranslationSource {

    private final ChannelVideoRepository videos;
    private final UserRepository users;
    private final ChannelSubscriptionRepository subscriptions;
    private final ContentAccess access;

    public ChannelVideoTextSource(
            ChannelVideoRepository videos,
            UserRepository users,
            ChannelSubscriptionRepository subscriptions,
            ContentAccess access) {
        this.videos = videos;
        this.users = users;
        this.subscriptions = subscriptions;
        this.access = access;
    }

    @Override
    public String type() {
        return ContentTypes.CHANNEL_VIDEO;
    }

    @Override
    public Optional<ContentSnapshot> load(UUID contentId) {
        return videos.findById(contentId).map(video -> new ContentSnapshot(
                type(),
                video.getId(),
                ContentTexts.locale(video.getTextSourceLocale()),
                ContentTexts.fields("title", video.getTitle(), "description", video.getDescription()),
                video.getOwnerId(),
                null));
    }

    @Override
    public boolean canRead(ContentSnapshot snapshot, UUID viewer) {
        ChannelVideo video = videos.findById(snapshot.contentId()).orElse(null);
        if (video == null) {
            return false;
        }
        if (access.same(viewer, video.getOwnerId()) || access.staff(viewer)) {
            return true;
        }
        User owner = users.findById(video.getOwnerId()).orElse(null);
        if (owner == null || !owner.isChannelPublic()) {
            return false;
        }
        if (!"APPLICANT".equals(owner.getRole()) && !"ADMIN".equals(owner.getRole())) {
            return false;
        }
        String visibility = video.getVisibility() == null ? "" : video.getVisibility().trim().toUpperCase(Locale.ROOT);
        if (ChannelVideoVisibility.PUBLIC.equals(visibility)) {
            return true;
        }
        if (ChannelVideoVisibility.SUBSCRIBERS_ONLY.equals(visibility)) {
            return viewer != null && subscriptions.existsBySubscriberIdAndChannelOwnerId(viewer, video.getOwnerId());
        }
        return false;
    }

    @Override
    public boolean canWrite(ContentSnapshot snapshot, UUID viewer) {
        return access.same(viewer, snapshot.ownerUserId()) || access.staff(viewer);
    }
}
