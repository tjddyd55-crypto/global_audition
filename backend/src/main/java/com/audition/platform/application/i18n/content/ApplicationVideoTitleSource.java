package com.audition.platform.application.i18n.content;

import com.audition.platform.application.i18n.content.ContentTranslationRows.ContentSnapshot;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.ApplicationVideoRepository;
import com.audition.platform.domain.audition.AuditionRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Component
public class ApplicationVideoTitleSource implements ContentTranslationSource {

    static final Set<String> LISTABLE_STATUSES = Set.of("SUBMITTED", "REVIEWING", "ACCEPTED");

    private final ApplicationVideoRepository videos;
    private final ApplicationRepository applications;
    private final AuditionRepository auditions;
    private final ContentAccess access;

    public ApplicationVideoTitleSource(
            ApplicationVideoRepository videos,
            ApplicationRepository applications,
            AuditionRepository auditions,
            ContentAccess access) {
        this.videos = videos;
        this.applications = applications;
        this.auditions = auditions;
        this.access = access;
    }

    @Override
    public String type() {
        return ContentTypes.APPLICATION_VIDEO;
    }

    @Override
    public Optional<ContentSnapshot> load(UUID contentId) {
        return videos.findById(contentId).flatMap(video -> applications.findById(video.getApplicationId()).map(application -> {
            UUID agencyId = auditions.findById(application.getAuditionId()).map(audition -> audition.getOwnerId()).orElse(null);
            return new ContentSnapshot(
                    type(),
                    video.getId(),
                    ContentTexts.locale(video.getTextSourceLocale()),
                    ContentTexts.fields("title", video.getTitle()),
                    application.getApplicantId(),
                    agencyId);
        }));
    }

    @Override
    public boolean canRead(ContentSnapshot snapshot, UUID viewer) {
        if (access.same(viewer, snapshot.ownerUserId())
                || access.same(viewer, snapshot.agencyUserId())
                || access.staff(viewer)) {
            return true;
        }
        return videos.findById(snapshot.contentId())
                .flatMap(video -> applications.findById(video.getApplicationId()))
                .map(application -> LISTABLE_STATUSES.contains(application.getStatus()))
                .orElse(false);
    }

    @Override
    public boolean canWrite(ContentSnapshot snapshot, UUID viewer) {
        return access.same(viewer, snapshot.ownerUserId())
                || access.same(viewer, snapshot.agencyUserId())
                || access.staff(viewer);
    }
}
