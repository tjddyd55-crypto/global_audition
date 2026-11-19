package com.audition.platform.application.casting;

import com.audition.platform.application.casting.CastingOfferStore.Offer;
import com.audition.platform.application.casting.CastingViews.EventView;
import com.audition.platform.application.casting.CastingViews.OfferView;
import com.audition.platform.application.casting.CastingViews.Party;
import com.audition.platform.application.casting.CastingViews.Quota;
import com.audition.platform.application.casting.CastingViews.SharedContact;
import com.audition.platform.application.channel.CastingOfferEligibility;
import com.audition.platform.application.consent.MinorPolicyService;
import com.audition.platform.application.org.JdbcCrmStore;
import com.audition.platform.application.org.JdbcCrmStore.AgencyRow;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 캐스팅 제안: 승인 기획사 발송 · 지원자 수신함 응답 · 서버 상태 전이 · 이력 · 알림.
 * 수락은 계약·지원서·결제·크레딧 차감을 만들지 않는다.
 */
@Service
public class CastingService {

    private final CastingOfferStore offers;
    private final CastingSafetyStore safety;
    private final CastingOfferEligibility eligibility;
    private final UserRepository users;
    private final JdbcCrmStore crm;
    private final AuditionRepository auditions;
    private final UserNotificationService notifications;
    private final MinorPolicyService minorPolicy;

    public CastingService(CastingOfferStore offers, CastingSafetyStore safety, CastingOfferEligibility eligibility,
                          UserRepository users, JdbcCrmStore crm, AuditionRepository auditions,
                          UserNotificationService notifications, MinorPolicyService minorPolicy) {
        this.minorPolicy = minorPolicy;
        this.offers = offers;
        this.safety = safety;
        this.eligibility = eligibility;
        this.users = users;
        this.crm = crm;
        this.auditions = auditions;
        this.notifications = notifications;
    }

    // ───────────────────────── 기획사 ─────────────────────────

    public UUID requireApprovedAgency() {
        UUID me = SecurityUtils.getCurrentUserId();
        if (me == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "LOGIN_REQUIRED");
        }
        if (!eligibility.approvedAgency(me)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "AGENCY_NOT_APPROVED");
        }
        return me;
    }

    public Quota quota() {
        UUID me = SecurityUtils.getCurrentUserId();
        if (me == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "LOGIN_REQUIRED");
        }
        boolean approved = eligibility.approvedAgency(me);
        CastingSafetyStore.Control c = safety.control(me).orElse(null);
        return new Quota(offers.countSentSince(me, startOfTodayUtc()), dailyLimit(c),
                c != null && c.restricted(), c != null ? c.reason() : null, approved);
    }

    public CastingViews.Preview preview(CastingRules.OfferInput in) {
        UUID me = requireApprovedAgency();
        java.time.ZoneId zone = agencyZone(me);
        CastingRules.CleanOffer clean = CastingRules.clean(in, LocalDate.now(zone), zone);
        UUID branch = branchFor(me, clean.branchId());
        User talent = users.findById(clean.talentUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "TALENT_NOT_FOUND"));
        List<String> warnings = new ArrayList<>();
        try {
            clean = protectMinor(talent, clean);
            checkSendable(me, talent, clean);
        } catch (ResponseStatusException e) {
            warnings.add(e.getReason());
        }
        Offer draft = new Offer(null, me, branch, talent.getId(), "DRAFT", clean.title(), clean.projectType(),
                clean.roleField(), clean.message(), clean.workCountry(), clean.workLocation(), clean.scheduleText(),
                clean.compensationType(), clean.compensationNote(), clean.auditionId(), clean.contactRequested(), false,
                clean.sourceLocale(), clean.expiresAt(), null, null, null, null, null, Instant.now(), Instant.now());
        // 발신 기획사 관점으로만 만든다(차단 여부 등 지원자 전용 값 노출 금지).
        return new CastingViews.Preview(view(draft, true, false), warnings);
    }

    @Transactional
    public OfferView send(CastingRules.OfferInput in) {
        UUID me = requireApprovedAgency();
        java.time.ZoneId zone = agencyZone(me);
        CastingRules.CleanOffer clean = CastingRules.clean(in, LocalDate.now(zone), zone);
        UUID branch = branchFor(me, clean.branchId());
        User talent = users.findById(clean.talentUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "TALENT_NOT_FOUND"));
        // 같은 기획사의 동시 발송을 트랜잭션 끝까지 직렬화해 한도·중복 검사를 원자적으로 만든다.
        offers.lockAgency(me);
        clean = protectMinor(talent, clean);
        checkSendable(me, talent, clean);
        UUID id = offers.insert(me, clean, branch);
        notifications.notify(talent.getId(), UserNotificationService.CASTING_OFFER_NEW,
                Map.of("agency", agencyName(me, branch), "title", clean.title()),
                "/my/studio/casting/" + id, "offer-new:" + id);
        return view(offers.find(id).orElseThrow(), true, false);
    }

    /**
     * 미성년자 보호(국가 정책이 연락처 공유를 허용하지 않을 때): 연락처 공유 요청을 붙이지 않고,
     * 본문·장소·일정·보상 메모에 URL·이메일·전화번호를 넣으면 거절한다.
     */
    CastingRules.CleanOffer protectMinor(User talent, CastingRules.CleanOffer clean) {
        MinorPolicyService.Status st = minorPolicy.status(talent);
        if (st.contactSharingAllowed()) {
            return clean;
        }
        if (CastingRules.containsContact(clean)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "OFFER_MINOR_CONTACT_TEXT");
        }
        return clean.contactRequested() ? CastingRules.withoutContactRequest(clean) : clean;
    }

    void checkSendable(UUID agencyId, User talent, CastingRules.CleanOffer clean) {
        CastingSafetyStore.Control c = safety.control(agencyId).orElse(null);
        if (c != null && c.restricted()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "CASTING_RESTRICTED");
        }
        if (agencyId.equals(talent.getId()) || !eligibility.receivable(talent) || safety.blocked(talent.getId(), agencyId)
                || !talent.isChannelPublic()) {
            // 차단 여부는 드러내지 않는다.
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "TALENT_NOT_ACCEPTING");
        }
        if (offers.countSentSince(agencyId, startOfTodayUtc()) >= dailyLimit(c)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "CASTING_DAILY_LIMIT");
        }
        if (offers.hasOpenPair(agencyId, talent.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "OFFER_ALREADY_OPEN");
        }
        Instant declined = offers.lastDeclinedAt(agencyId, talent.getId()).orElse(null);
        if (declined != null && declined.plus(CastingRules.DECLINE_COOLDOWN).isAfter(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "OFFER_COOLDOWN");
        }
        if (offers.countPairSince(agencyId, talent.getId(), Instant.now().minus(Duration.ofDays(90)))
                >= CastingRules.PAIR_MAX_90_DAYS) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "OFFER_PAIR_LIMIT");
        }
        if (clean.auditionId() != null) {
            boolean own = auditions.findById(clean.auditionId()).map(a -> agencyId.equals(a.getOwnerId())).orElse(false);
            if (!own) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "OFFER_AUDITION_INVALID");
            }
        }
    }

    public List<OfferView> agencyOffers(String status, UUID talentId) {
        UUID me = requireAgencyRole();
        String s = status == null || status.isBlank() ? null : status.trim().toUpperCase();
        if (s != null && !CastingOfferStatus.ALL.contains(s)) {
            throw CastingRules.bad("OFFER_STATUS_INVALID");
        }
        // 상태 필터도 서버 시각 기준 실제 상태로 맞춘다(정기 정리 전이라도 마감 지난 제안은 EXPIRED).
        return offers.forAgency(me, null, talentId).stream().map(o -> view(o, true, false))
                .filter(v -> s == null || s.equals(v.status())).toList();
    }

    public OfferView agencyOffer(UUID id) {
        UUID me = requireAgencyRole();
        Offer o = offers.find(id).filter(x -> x.agencyUserId().equals(me))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "OFFER_NOT_FOUND"));
        return view(o, true, true);
    }

    @Transactional
    public OfferView withdraw(UUID id, String note) {
        UUID me = requireAgencyRole();
        Offer o = offers.find(id).filter(x -> x.agencyUserId().equals(me))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "OFFER_NOT_FOUND"));
        move(o, CastingOfferStatus.WITHDRAWN, me, CastingOfferStatus.ACTOR_AGENCY, CastingRules.text(note, 300), null, null);
        notifications.notify(o.talentUserId(), UserNotificationService.CASTING_OFFER_WITHDRAWN,
                Map.of("agency", agencyName(o.agencyUserId(), o.branchId()), "title", o.title()),
                "/my/studio/casting/" + id, "offer-withdrawn:" + id);
        return agencyOffer(id);
    }

    /** 승인 전 기획사도 보낸 제안 이력은 볼 수 있다(정지·제한 후 열람). */
    private UUID requireAgencyRole() {
        UUID me = SecurityUtils.getCurrentUserId();
        if (me == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "LOGIN_REQUIRED");
        }
        User u = users.findById(me).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "LOGIN_REQUIRED"));
        if (!com.audition.platform.application.org.OrgRoles.agencyOperator(u.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "AGENCY_ONLY");
        }
        return me;
    }

    // ───────────────────────── 지원자 ─────────────────────────

    public List<OfferView> myOffers() {
        UUID me = requireUser();
        return offers.forTalent(me).stream().map(o -> view(o, false, false)).toList();
    }

    /** 상세를 열면 SENT → READ, 기획사에 열람 알림. */
    @Transactional
    public OfferView myOffer(UUID id) {
        UUID me = requireUser();
        Offer o = mine(id, me);
        if (CastingOfferStatus.SENT.equals(o.status()) && !expiredNow(o)) {
            if (offers.transition(id, CastingOfferStatus.SENT, CastingOfferStatus.READ, me, CastingOfferStatus.ACTOR_TALENT,
                    null, null, null)) {
                notifications.notify(o.agencyUserId(), UserNotificationService.CASTING_OFFER_READ,
                        Map.of("talent", talentName(o.talentUserId()), "title", o.title()),
                        "/my/casting/" + id, "offer-read:" + id);
            }
            o = mine(id, me);
        }
        return view(o, false, true);
    }

    @Transactional
    public OfferView accept(UUID id, boolean shareContact, String note) {
        UUID me = requireUser();
        Offer o = mine(id, me);
        expireIfDue(o);
        // 미성년자는 가입 동의만으로 연락처를 공유하지 않는다(국가 정책이 허용할 때만).
        boolean share = shareContact && o.contactRequested()
                && minorPolicy.status(users.findById(me).orElse(null)).contactSharingAllowed();
        move(o, CastingOfferStatus.ACCEPTED, me, CastingOfferStatus.ACTOR_TALENT, CastingRules.text(note, 500), null, share);
        notifications.notify(o.agencyUserId(), UserNotificationService.CASTING_OFFER_ACCEPTED,
                Map.of("talent", talentName(me), "title", o.title()), "/my/casting/" + id, "offer-accepted:" + id);
        return view(mine(id, me), false, true);
    }

    @Transactional
    public OfferView decline(UUID id, String reason, String note) {
        UUID me = requireUser();
        Offer o = mine(id, me);
        expireIfDue(o);
        move(o, CastingOfferStatus.DECLINED, me, CastingOfferStatus.ACTOR_TALENT, CastingRules.text(note, 500),
                CastingRules.declineReason(reason), null);
        notifications.notify(o.agencyUserId(), UserNotificationService.CASTING_OFFER_DECLINED,
                Map.of("talent", talentName(me), "title", o.title()), "/my/casting/" + id, "offer-declined:" + id);
        return view(mine(id, me), false, true);
    }

    @Transactional
    public UUID report(UUID id, String reason, String detail, boolean blockAgency) {
        UUID me = requireUser();
        Offer o = mine(id, me);
        UUID reportId = safety.report(id, me, o.agencyUserId(), CastingRules.reportReason(reason), CastingRules.text(detail, 1000));
        if (blockAgency) {
            safety.block(me, o.agencyUserId());
        }
        return reportId;
    }

    public void blockAgencyOfOffer(UUID id) {
        UUID me = requireUser();
        safety.block(me, mine(id, me).agencyUserId());
    }

    public void unblockAgency(UUID agencyUserId) {
        UUID me = requireUser();
        safety.unblock(me, agencyUserId);
    }

    public List<Party> myBlocks() {
        UUID me = requireUser();
        return safety.blockedAgencies(me).stream().map(a -> agencyParty(a, null)).toList();
    }

    // ───────────────────────── 시스템 ─────────────────────────

    /** 기한 지난 열린 제안 → EXPIRED. 마감 24시간 전 알림. */
    @Transactional
    public int sweep() {
        Instant now = Instant.now();
        int n = 0;
        for (Offer o : offers.dueForExpiry(now)) {
            if (offers.transition(o.id(), o.status(), CastingOfferStatus.EXPIRED, null, CastingOfferStatus.ACTOR_SYSTEM,
                    null, null, null)) {
                n++;
            }
        }
        for (Offer o : offers.dueForDeadlineNotice(now, now.plus(CastingRules.DEADLINE_NOTICE))) {
            notifications.notify(o.talentUserId(), UserNotificationService.CASTING_OFFER_DEADLINE,
                    Map.of("agency", agencyName(o.agencyUserId(), o.branchId()), "title", o.title()),
                    "/my/studio/casting/" + o.id(), "offer-deadline:" + o.id());
            offers.markDeadlineNotified(o.id());
        }
        return n;
    }

    // ───────────────────────── 내부 ─────────────────────────

    private void expireIfDue(Offer o) {
        if (expiredNow(o)) {
            offers.transition(o.id(), o.status(), CastingOfferStatus.EXPIRED, null, CastingOfferStatus.ACTOR_SYSTEM,
                    null, null, null);
            throw new ResponseStatusException(HttpStatus.CONFLICT, "OFFER_EXPIRED");
        }
    }

    private void move(Offer o, String to, UUID actor, String actorKind, String note, String reason, Boolean share) {
        if (!CastingOfferStatus.canTransition(o.status(), to, actorKind)
                || !offers.transition(o.id(), o.status(), to, actor, actorKind, note, reason, share)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "OFFER_STATE_CONFLICT");
        }
    }

    private Offer mine(UUID id, UUID me) {
        return offers.find(id).filter(x -> x.talentUserId().equals(me))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "OFFER_NOT_FOUND"));
    }

    private UUID requireUser() {
        UUID me = SecurityUtils.getCurrentUserId();
        if (me == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "LOGIN_REQUIRED");
        }
        return me;
    }

    private UUID branchFor(UUID agencyId, UUID requested) {
        List<AgencyRow> branches = eligibility.approvedBranches(agencyId);
        if (requested == null) {
            return branches.isEmpty() ? null : branches.get(0).id();
        }
        return branches.stream().filter(b -> b.id().equals(requested)).findFirst()
                .map(AgencyRow::id)
                .orElseThrow(() -> CastingRules.bad("OFFER_BRANCH_INVALID"));
    }

    private int dailyLimit(CastingSafetyStore.Control c) {
        return c != null && c.dailyLimit() != null && c.dailyLimit() >= 0 ? c.dailyLimit() : CastingRules.DEFAULT_DAILY_LIMIT;
    }

    /** 서버 현재 시각이 마감(포함)을 지난 열린 제안. 정기 작업과 무관하게 즉시 만료로 본다. */
    static boolean expiredNow(Offer o) {
        return CastingOfferStatus.open(o.status()) && o.expiresAt() != null && !o.expiresAt().isAfter(Instant.now());
    }

    static String effectiveStatus(Offer o) {
        return expiredNow(o) ? CastingOfferStatus.EXPIRED : o.status();
    }

    OfferView view(Offer o, boolean forAgency, boolean withHistory) {
        SharedContact contact = null;
        if (forAgency && o.contactShared() && CastingOfferStatus.ACCEPTED.equals(o.status())) {
            User t = users.findById(o.talentUserId()).orElse(null);
            contact = t == null ? null : new SharedContact(t.getEmail(), null);
        }
        List<EventView> history = withHistory
                ? offers.events(o.id() == null ? UUID.randomUUID() : o.id()).stream()
                        .map(e -> new EventView(e.fromStatus(), e.toStatus(), e.actorKind(), e.createdAt())).toList()
                : List.of();
        boolean blocked = !forAgency && o.agencyUserId() != null && safety.blocked(o.talentUserId(), o.agencyUserId());
        String status = "DRAFT".equals(o.status()) ? o.status() : effectiveStatus(o);
        boolean respondable = CastingOfferStatus.open(status);
        return new OfferView(o.id() == null ? null : o.id().toString(), status, o.title(), o.projectType(),
                o.roleField(), o.message(), o.workCountry(), o.workLocation(), o.scheduleText(), o.compensationType(),
                o.compensationNote(), o.auditionId() == null ? null : o.auditionId().toString(), o.contactRequested(),
                o.contactShared(), o.sourceLocale(), o.expiresAt(), o.readAt(), o.respondedAt(), o.responseReason(),
                forAgency || o.responseNote() != null ? o.responseNote() : null, o.createdAt(),
                agencyParty(o.agencyUserId(), o.branchId()), talentParty(o.talentUserId()), contact, history, blocked,
                CastingOfferStatus.EXPIRED.equals(status), respondable, Instant.now());
    }

    private Party agencyParty(UUID agencyId, UUID branchId) {
        AgencyRow branch = branchId == null ? null : crm.find(branchId).orElse(null);
        User u = users.findById(agencyId).orElse(null);
        String name = branch != null && branch.displayName() != null ? branch.displayName()
                : u == null ? "" : firstNonBlank(u.getDisplayName(), u.getNickname(), "");
        return new Party(agencyId.toString(), name, u == null ? null : u.getProfileImageUrl(),
                branch == null ? null : branch.countryCode());
    }

    private Party talentParty(UUID talentId) {
        User u = users.findById(talentId).orElse(null);
        return new Party(talentId.toString(), u == null ? "" : firstNonBlank(u.getNickname(), u.getDisplayName(), ""),
                u == null ? null : u.getProfileImageUrl(), u == null ? null : u.getNationality());
    }

    private String agencyName(UUID agencyId, UUID branchId) {
        return agencyParty(agencyId, branchId).name();
    }

    private String talentName(UUID talentId) {
        return talentParty(talentId).name();
    }

    private static String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.isBlank()) {
                return v.trim();
            }
        }
        return "";
    }

    private java.time.ZoneId agencyZone(UUID agencyId) {
        String tz = users.findById(agencyId).map(User::getTimezone).orElse(null);
        if (tz != null && !tz.isBlank()) {
            try {
                return java.time.ZoneId.of(tz.trim());
            } catch (java.time.DateTimeException ignored) {
                // 잘못 저장된 값은 UTC 로 본다.
            }
        }
        return ZoneOffset.UTC;
    }

    static LocalDate today() {
        return LocalDate.now(ZoneOffset.UTC);
    }

    static Instant startOfTodayUtc() {
        return today().atStartOfDay(ZoneOffset.UTC).toInstant();
    }
}
