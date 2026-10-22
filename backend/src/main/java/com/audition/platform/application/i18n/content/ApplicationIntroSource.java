package com.audition.platform.application.i18n.content;

import com.audition.platform.application.i18n.content.ContentTranslationRows.ContentSnapshot;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.AuditionRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
public class ApplicationIntroSource implements ContentTranslationSource {

    private final ApplicationRepository applications;
    private final AuditionRepository auditions;
    private final ContentAccess access;

    public ApplicationIntroSource(ApplicationRepository applications, AuditionRepository auditions, ContentAccess access) {
        this.applications = applications;
        this.auditions = auditions;
        this.access = access;
    }

    @Override
    public String type() {
        return ContentTypes.APPLICATION_INTRO;
    }

    @Override
    public Optional<ContentSnapshot> load(UUID contentId) {
        return applications.findById(contentId).map(application -> {
            UUID agencyId = auditions.findById(application.getAuditionId()).map(audition -> audition.getOwnerId()).orElse(null);
            return new ContentSnapshot(
                    type(),
                    application.getId(),
                    ContentTexts.locale(application.getIntroSourceLocale()),
                    ContentTexts.fields("introText", application.getIntroText()),
                    application.getApplicantId(),
                    agencyId);
        });
    }

    @Override
    public boolean canRead(ContentSnapshot snapshot, UUID viewer) {
        return access.same(viewer, snapshot.ownerUserId())
                || access.same(viewer, snapshot.agencyUserId())
                || access.staff(viewer);
    }

    @Override
    public boolean canWrite(ContentSnapshot snapshot, UUID viewer) {
        return canRead(snapshot, viewer);
    }
}
