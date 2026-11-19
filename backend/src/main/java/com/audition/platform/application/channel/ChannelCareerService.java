package com.audition.platform.application.channel;

import com.audition.platform.application.channel.ChannelCareerStore.Career;
import com.audition.platform.domain.user.UserRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

/** 활동 경력 CRUD. 경력이 없어도 채널은 정상 운영된다. */
@Service
public class ChannelCareerService {

    public static final Set<String> CATEGORIES = Set.of(
            "PERFORMANCE", "TRAINING", "DANCE_VOCAL", "ACTING_MODEL", "CONTEST_AWARD", "OTHER");
    private static final Pattern PERIOD = Pattern.compile("^\\d{4}(-(0[1-9]|1[0-2]))?$");

    public record CareerInput(String category, String title, String organization, String periodStart,
                              String periodEnd, String description, String sourceLocale, Boolean visible,
                              Integer sortOrder) {
    }

    public record CareerView(String id, String category, String title, String organization, String periodStart,
                             String periodEnd, String description, boolean visible, int sortOrder) {
        static CareerView of(Career c) {
            return new CareerView(c.id().toString(), c.category(), c.title(), c.organization(), c.periodStart(),
                    c.periodEnd(), c.description(), c.visible(), c.sortOrder());
        }
    }

    private final ChannelCareerStore store;
    private final UserRepository users;

    public ChannelCareerService(ChannelCareerStore store, UserRepository users) {
        this.store = store;
        this.users = users;
    }

    public List<CareerView> mine() {
        return store.list(me(), false).stream().map(CareerView::of).toList();
    }

    public List<CareerView> publicFor(UUID userId) {
        return store.list(userId, true).stream().map(CareerView::of).toList();
    }

    @Transactional
    public CareerView create(CareerInput in) {
        UUID me = me();
        if (store.count(me) >= ChannelPortfolioRules.MAX_CAREERS) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "CAREER_LIMIT");
        }
        Career c = validated(UUID.randomUUID(), me, in, null);
        store.insert(c);
        touch(me);
        return CareerView.of(store.find(c.id()).orElseThrow());
    }

    @Transactional
    public CareerView update(UUID id, CareerInput in) {
        UUID me = me();
        Career cur = store.find(id).filter(c -> c.userId().equals(me))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CAREER_NOT_FOUND"));
        store.update(validated(id, me, in, cur));
        touch(me);
        return CareerView.of(store.find(id).orElseThrow());
    }

    @Transactional
    public void delete(UUID id) {
        UUID me = me();
        if (store.delete(id, me) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "CAREER_NOT_FOUND");
        }
        touch(me);
    }

    static Career validated(UUID id, UUID userId, CareerInput in, Career cur) {
        String category = pick(in.category(), cur == null ? null : cur.category());
        category = category == null ? null : category.trim().toUpperCase(Locale.ROOT);
        if (category == null || !CATEGORIES.contains(category)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "CAREER_CATEGORY_INVALID");
        }
        String title = text(pick(in.title(), cur == null ? null : cur.title()), 120);
        if (title == null) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "CAREER_TITLE_REQUIRED");
        }
        String org = in.organization() != null ? text(in.organization(), 120) : cur == null ? null : cur.organization();
        String start = in.periodStart() != null ? period(in.periodStart()) : cur == null ? null : cur.periodStart();
        String end = in.periodEnd() != null ? period(in.periodEnd()) : cur == null ? null : cur.periodEnd();
        if (start != null && end != null && end.compareTo(start) < 0) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "CAREER_PERIOD_INVALID");
        }
        String desc = in.description() != null ? text(in.description(), 1000) : cur == null ? null : cur.description();
        String locale = in.sourceLocale() != null ? text(in.sourceLocale(), 35) : cur == null ? null : cur.sourceLocale();
        boolean visible = in.visible() != null ? in.visible() : cur == null || cur.visible();
        int sort = in.sortOrder() != null ? Math.max(0, Math.min(999, in.sortOrder())) : cur == null ? 0 : cur.sortOrder();
        return new Career(id, userId, category, title, org, start, end, desc, locale, visible, sort, null, null);
    }

    private static String pick(String a, String b) {
        return a != null ? a : b;
    }

    private static String text(String raw, int max) {
        if (raw == null) {
            return null;
        }
        String t = raw.trim();
        if (t.isEmpty()) {
            return null;
        }
        return t.length() > max ? t.substring(0, max) : t;
    }

    private static String period(String raw) {
        String t = raw.trim();
        if (t.isEmpty()) {
            return null;
        }
        if (!PERIOD.matcher(t).matches()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "CAREER_PERIOD_INVALID");
        }
        return t;
    }

    private void touch(UUID userId) {
        users.findById(userId).ifPresent(u -> {
            u.setLastActiveAt(Instant.now());
            users.save(u);
        });
    }

    private static UUID me() {
        UUID id = SecurityUtils.getCurrentUserId();
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        if (!SecurityUtils.hasRole("APPLICANT") && !SecurityUtils.hasRole("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "지원자 채널만 이용할 수 있습니다.");
        }
        return id;
    }
}
