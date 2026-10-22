package com.audition.platform.application.i18n.content;

import com.audition.platform.application.i18n.content.ContentTranslationRows.ContentSnapshot;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.audition.AuditionRound;
import com.audition.platform.domain.audition.AuditionRoundRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
public class AuditionRoundNoticeSource implements ContentTranslationSource {

    private final AuditionRoundRepository rounds;
    private final AuditionRepository auditions;
    private final ContentAccess access;

    public AuditionRoundNoticeSource(AuditionRoundRepository rounds, AuditionRepository auditions, ContentAccess access) {
        this.rounds = rounds;
        this.auditions = auditions;
        this.access = access;
    }

    @Override
    public String type() {
        return ContentTypes.AUDITION_ROUND;
    }

    @Override
    public Optional<ContentSnapshot> load(UUID contentId) {
        return rounds.findById(contentId).map(round -> {
            UUID ownerId = auditions.findById(round.getAuditionId()).map(Audition::getOwnerId).orElse(null);
            return new ContentSnapshot(
                    type(),
                    round.getId(),
                    ContentTexts.locale(round.getNoticeSourceLocale()),
                    ContentTexts.fields(
                            "roundName", round.getRoundName(),
                            "announcementTitle", round.getAnnouncementTitle(),
                            "announcementBody", round.getAnnouncementBody(),
                            "submissionLabel", round.getSubmissionLabel(),
                            "submissionGuide", round.getSubmissionGuide()),
                    ownerId,
                    ownerId);
        });
    }

    @Override
    public boolean canRead(ContentSnapshot snapshot, UUID viewer) {
        if (access.same(viewer, snapshot.ownerUserId()) || access.staff(viewer)) {
            return true;
        }
        AuditionRound round = rounds.findById(snapshot.contentId()).orElse(null);
        if (round == null) {
            return false;
        }
        Audition audition = auditions.findById(round.getAuditionId()).orElse(null);
        if (audition == null) {
            return false;
        }
        return "OPEN".equals(audition.getStatus()) || "CLOSED".equals(audition.getStatus());
    }

    @Override
    public boolean canWrite(ContentSnapshot snapshot, UUID viewer) {
        return access.same(viewer, snapshot.ownerUserId()) || access.staff(viewer);
    }
}
