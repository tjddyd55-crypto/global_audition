package com.audition.platform.application.i18n.content;

import com.audition.platform.application.casting.CastingOfferStore;
import com.audition.platform.application.i18n.content.ContentTranslationRows.ContentSnapshot;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

/**
 * 캐스팅 제안 자유 입력(제목·메시지·일정·보수 메모·지역). 지원자·보낸 기획사·운영자만 읽는다.
 * 연락처·내부 메모·응답 메모는 넣지 않는다(proseFields 가 이메일/전화도 보호).
 */
@Component
public class CastingOfferSource implements ContentTranslationSource {

    private final CastingOfferStore offers;
    private final ContentAccess access;

    public CastingOfferSource(CastingOfferStore offers, ContentAccess access) {
        this.offers = offers;
        this.access = access;
    }

    @Override
    public String type() {
        return ContentTypes.CASTING_OFFER;
    }

    @Override
    public Optional<ContentSnapshot> load(UUID contentId) {
        return offers.find(contentId).map(o -> new ContentSnapshot(type(), o.id(), ContentTexts.locale(o.sourceLocale()),
                ContentTexts.proseFields("title", o.title(), "message", o.message(), "scheduleText", o.scheduleText(),
                        "compensationNote", o.compensationNote(), "workLocation", o.workLocation()),
                o.talentUserId(), o.agencyUserId()));
    }

    @Override
    public boolean canRead(ContentSnapshot snapshot, UUID viewer) {
        return access.same(viewer, snapshot.ownerUserId()) || access.same(viewer, snapshot.agencyUserId())
                || access.staff(viewer);
    }

    @Override
    public boolean canWrite(ContentSnapshot snapshot, UUID viewer) {
        return access.same(viewer, snapshot.agencyUserId()) || access.staff(viewer);
    }
}
