package com.audition.platform.application.i18n.content;

import com.audition.platform.application.i18n.content.ContentTranslationRows.ContentSnapshot;
import com.audition.platform.domain.channel.ChannelRepository;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
public class ChannelDescriptionSource implements ContentTranslationSource {

    private final ChannelRepository channels;
    private final UserRepository users;
    private final ContentAccess access;

    public ChannelDescriptionSource(ChannelRepository channels, UserRepository users, ContentAccess access) {
        this.channels = channels;
        this.users = users;
        this.access = access;
    }

    @Override
    public String type() {
        return ContentTypes.CHANNEL_DESCRIPTION;
    }

    @Override
    public Optional<ContentSnapshot> load(UUID contentId) {
        return channels.findById(contentId).map(channel -> new ContentSnapshot(
                type(),
                channel.getId(),
                ContentTexts.locale(channel.getDescriptionSourceLocale()),
                ContentTexts.fields("description", channel.getDescription()),
                channel.getOwnerId(),
                null));
    }

    @Override
    public boolean canRead(ContentSnapshot snapshot, UUID viewer) {
        if (access.same(viewer, snapshot.ownerUserId()) || access.staff(viewer)) {
            return true;
        }
        User owner = users.findById(snapshot.ownerUserId()).orElse(null);
        return owner != null && owner.isChannelPublic();
    }

    @Override
    public boolean canWrite(ContentSnapshot snapshot, UUID viewer) {
        return access.same(viewer, snapshot.ownerUserId()) || access.staff(viewer);
    }
}
