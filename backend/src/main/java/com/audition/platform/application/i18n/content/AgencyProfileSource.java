package com.audition.platform.application.i18n.content;

import com.audition.platform.application.i18n.content.ContentTranslationRows.ContentSnapshot;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
public class AgencyProfileSource implements ContentTranslationSource {

    private final UserRepository users;
    private final ContentAccess access;

    public AgencyProfileSource(UserRepository users, ContentAccess access) {
        this.users = users;
        this.access = access;
    }

    @Override
    public String type() {
        return ContentTypes.AGENCY_PROFILE;
    }

    @Override
    public Optional<ContentSnapshot> load(UUID contentId) {
        return users.findById(contentId)
                .filter(user -> "AGENCY".equals(user.getRole()))
                .map(user -> new ContentSnapshot(
                        type(),
                        user.getId(),
                        ContentTexts.locale(user.getTextSourceLocale()),
                        ContentTexts.fields("bio", user.getBio(), "introText", user.getIntroText()),
                        user.getId(),
                        user.getId()));
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
