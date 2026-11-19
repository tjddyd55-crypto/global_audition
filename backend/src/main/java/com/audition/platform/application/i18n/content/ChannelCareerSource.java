package com.audition.platform.application.i18n.content;

import com.audition.platform.application.channel.ChannelCareerStore;
import com.audition.platform.application.i18n.content.ContentTranslationRows.ContentSnapshot;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

/** 채널 활동 경력 한 건(제목·설명). 기관명·기간은 번역하지 않는다. */
@Component
public class ChannelCareerSource implements ContentTranslationSource {

    private final ChannelCareerStore careers;
    private final UserRepository users;
    private final ContentAccess access;

    public ChannelCareerSource(ChannelCareerStore careers, UserRepository users, ContentAccess access) {
        this.careers = careers;
        this.users = users;
        this.access = access;
    }

    @Override
    public String type() {
        return ContentTypes.CHANNEL_CAREER;
    }

    @Override
    public Optional<ContentSnapshot> load(UUID contentId) {
        return careers.find(contentId).map(c -> new ContentSnapshot(
                type(), c.id(), ContentTexts.locale(c.sourceLocale()),
                ContentTexts.proseFields("title", c.title(), "description", c.description()),
                c.userId(), null));
    }

    @Override
    public boolean canRead(ContentSnapshot snapshot, UUID viewer) {
        if (access.same(viewer, snapshot.ownerUserId()) || access.staff(viewer)) {
            return true;
        }
        User owner = users.findById(snapshot.ownerUserId()).orElse(null);
        if (owner == null || !owner.isChannelPublic()) {
            return false;
        }
        return careers.find(snapshot.contentId()).map(ChannelCareerStore.Career::visible).orElse(false);
    }

    @Override
    public boolean canWrite(ContentSnapshot snapshot, UUID viewer) {
        return access.same(viewer, snapshot.ownerUserId()) || access.staff(viewer);
    }
}
