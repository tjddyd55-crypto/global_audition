package com.audition.platform.application.i18n.content;

import com.audition.platform.application.i18n.content.ContentTranslationRows.ContentSnapshot;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
public class UserIntroSource implements ContentTranslationSource {

    private final UserRepository users;
    private final ContentAccess access;

    public UserIntroSource(UserRepository users, ContentAccess access) {
        this.users = users;
        this.access = access;
    }

    @Override
    public String type() {
        return ContentTypes.USER_INTRO;
    }

    @Override
    public Optional<ContentSnapshot> load(UUID contentId) {
        return users.findById(contentId).map(user -> new ContentSnapshot(
                type(),
                user.getId(),
                ContentTexts.locale(user.getTextSourceLocale()),
                ContentTexts.proseFields(
                        "introText", user.getIntroText(),
                        "shortBio", user.getShortBio(),
                        "bio", user.getBio()),
                user.getId(),
                null));
    }

    @Override
    public boolean canRead(ContentSnapshot snapshot, UUID viewer) {
        if (access.same(viewer, snapshot.ownerUserId()) || access.staff(viewer)) {
            return true;
        }
        User owner = users.findById(snapshot.ownerUserId()).orElse(null);
        if (owner == null) {
            return false;
        }
        if (owner.isChannelPublic()) {
            return true;
        }
        return access.agencyOfApplicant(viewer, snapshot.ownerUserId());
    }

    @Override
    public boolean canWrite(ContentSnapshot snapshot, UUID viewer) {
        return access.same(viewer, snapshot.ownerUserId()) || access.staff(viewer);
    }
}
