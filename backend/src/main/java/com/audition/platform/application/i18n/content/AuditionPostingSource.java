package com.audition.platform.application.i18n.content;

import com.audition.platform.application.i18n.content.ContentTranslationRows.ContentSnapshot;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

/**
 * 공고 본문만 번역한다. 기획사명, 국가 코드, 상태, 금액, 일정 시각, 이미지·영상 주소는 넣지 않는다.
 */
@Component
public class AuditionPostingSource implements ContentTranslationSource {

    private final AuditionRepository auditions;
    private final ContentAccess access;

    public AuditionPostingSource(AuditionRepository auditions, ContentAccess access) {
        this.auditions = auditions;
        this.access = access;
    }

    @Override
    public String type() {
        return ContentTypes.AUDITION_POSTING;
    }

    @Override
    public Optional<ContentSnapshot> load(UUID contentId) {
        return auditions.findById(contentId).map(audition -> new ContentSnapshot(
                type(),
                audition.getId(),
                ContentTexts.locale(audition.getDefaultLocale()),
                ContentTexts.proseFields(
                        "title", audition.getTitle(),
                        "description", audition.getDescription(),
                        "recruitFields", ContentTexts.lines(audition.getRecruitFields()),
                        "qualifications", ContentTexts.lines(audition.getQualifications()),
                        "schedules", ContentTexts.lines(audition.getSchedules()),
                        "benefits", ContentTexts.lines(audition.getBenefits())),
                audition.getOwnerId(),
                audition.getOwnerId()));
    }

    @Override
    public boolean canRead(ContentSnapshot snapshot, UUID viewer) {
        if (access.same(viewer, snapshot.ownerUserId()) || access.staff(viewer)) {
            return true;
        }
        Audition audition = auditions.findById(snapshot.contentId()).orElse(null);
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
