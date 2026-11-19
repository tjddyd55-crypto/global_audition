package com.audition.platform.application.consent;

import com.audition.platform.application.channel.ChannelPortfolioRules;
import com.audition.platform.application.me.ChannelShownFields;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * 마이프로필 '개인정보 및 공개 설정' (10개 항목).
 * 새 저장소를 만들지 않고 기존 값(채널 공개, 인재 검색 노출, 캐스팅 제안 수신, channel_shown_fields)을 그대로 쓴다.
 * 미성년자의 검색 노출·제안 수신은 국가 정책과 보호자 확인 상태를 서버에서 함께 적용한다.
 */
@Service
public class PrivacySettingsService {

    /** 자기소개 = 짧은 소개 + 소개 본문 + 인사말. */
    static final List<String> BIO_KEYS = List.of(ChannelShownFields.SHORT_BIO, ChannelShownFields.BIO, ChannelShownFields.INTRO);
    /** 활동 경력 = 경력 + 활동 분야. */
    static final List<String> CAREER_KEYS = List.of(ChannelShownFields.CAREER, ChannelShownFields.ACTIVITY);

    private final UserRepository users;
    private final MinorPolicyService minorPolicy;
    private final ConsentService consents;
    private final GuardianService guardians;

    public PrivacySettingsService(UserRepository users, MinorPolicyService minorPolicy, ConsentService consents,
                                  GuardianService guardians) {
        this.users = users;
        this.minorPolicy = minorPolicy;
        this.consents = consents;
        this.guardians = guardians;
    }

    public record MinorView(boolean ageKnown, boolean minor, boolean guardianLegallyRequired, boolean guardianConfirmed,
                            String policyCountry, int adultAge, int guardianConsentUnderAge, boolean applyAllowed,
                            boolean searchAllowed, boolean offersAllowed, boolean contactSharingAllowed,
                            String offersBlockReason) {
    }

    public record Settings(boolean channelPublic, boolean talentSearchVisible, boolean castingOffersEnabled,
                           boolean showAge, boolean showGender, boolean showNationality, boolean showResidence,
                           boolean showBio, boolean showCareer, boolean showSns, String gender, boolean birthDateSet,
                           String ageBand, MinorView minor, List<ConsentService.ConsentView> consents,
                           GuardianService.MyGuardianView guardian, String termsVersion) {
    }

    public record Patch(Boolean channelPublic, Boolean talentSearchVisible, Boolean castingOffersEnabled, Boolean showAge,
                        Boolean showGender, Boolean showNationality, Boolean showResidence, Boolean showBio,
                        Boolean showCareer, Boolean showSns, String gender) {
    }

    public Settings get() {
        return view(requireUser());
    }

    @Transactional
    public Settings patch(Patch p) {
        User u = requireUser();
        if (p.gender() != null) {
            String g = ProfileCodes.gender(p.gender());
            u.setGender(g.isEmpty() ? null : g);
        }
        if (p.channelPublic() != null) {
            u.setChannelPublic(p.channelPublic());
        }
        if (p.talentSearchVisible() != null) {
            applySearchVisible(u, p.talentSearchVisible());
        }
        if (p.castingOffersEnabled() != null) {
            applyOffers(u, p.castingOffersEnabled());
        }
        LinkedHashSet<String> shown = new LinkedHashSet<>(ChannelShownFields.effective(u.getChannelShownFields()));
        toggle(shown, p.showAge(), List.of(ChannelShownFields.AGE));
        toggle(shown, p.showGender(), List.of(ChannelShownFields.GENDER));
        toggle(shown, p.showNationality(), List.of(ChannelShownFields.NATIONALITY));
        toggle(shown, p.showResidence(), List.of(ChannelShownFields.RESIDENCE));
        toggle(shown, p.showBio(), BIO_KEYS);
        toggle(shown, p.showCareer(), CAREER_KEYS);
        toggle(shown, p.showSns(), List.of(ChannelShownFields.SNS));
        if (anyShown(p)) {
            u.setChannelShownFields(ChannelShownFields.normalize(new ArrayList<>(shown)));
        }
        u.setUpdatedAt(Instant.now());
        users.save(u);
        return view(u);
    }

    /**
     * 인재 검색 노출 켜기/끄기. 켤 때: 국가 정책상 법정대리인 동의가 필요한 나이면 보호자 확인이 있어야 한다.
     * 켜는 행위 자체가 회원 본인의 공개 선택이므로 공개 범위 동의가 없거나 철회 상태이면 이 시점(SETTINGS)으로 기록한다.
     */
    public void applySearchVisible(User u, boolean on) {
        if (on) {
            MinorPolicyService.Status st = minorPolicy.status(u);
            if (!st.searchAllowed()) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "SEARCH_GUARDIAN_REQUIRED");
            }
            if (!ConsentService.AGREED.equals(consents.currentStatus(u.getId(), ConsentService.PRIVACY_DISCLOSURE))) {
                consents.insert(u.getId(), ConsentService.PRIVACY_DISCLOSURE, ConsentService.AGREED,
                        ConsentService.SRC_SETTINGS, null);
            }
        }
        u.setTalentSearchVisible(on);
    }

    public void applyOffers(User u, boolean on) {
        if (on) {
            String reason = minorPolicy.status(u).offersBlockReason();
            if (reason != null) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, reason);
            }
        }
        u.setCastingOffersEnabled(on);
    }

    /** 공개 범위 동의 철회 시 인재 검색 노출·캐스팅 제안 수신을 끈다. */
    @Transactional
    public Settings setConsent(String type, boolean agree) {
        User u = requireUser();
        consents.setSelf(u.getId(), type, agree);
        if (!agree && ConsentService.PRIVACY_DISCLOSURE.equalsIgnoreCase(type == null ? "" : type.trim())) {
            u.setTalentSearchVisible(false);
            u.setCastingOffersEnabled(false);
            u.setUpdatedAt(Instant.now());
            users.save(u);
        }
        return view(u);
    }

    Settings view(User u) {
        String[] shown = u.getChannelShownFields();
        MinorPolicyService.Status st = minorPolicy.status(u);
        MinorView mv = new MinorView(st.ageKnown(), st.minor(), st.guardianLegallyRequired(), st.guardianConfirmed(),
                st.policy().countryCode(), st.policy().adultAge(), st.policy().guardianConsentUnderAge(),
                st.applyAllowed(), st.searchAllowed(), st.offersAllowed(), st.contactSharingAllowed(),
                st.offersBlockReason());
        return new Settings(u.isChannelPublic(), u.isTalentSearchVisible(), u.isCastingOffersEnabled(),
                ChannelShownFields.visible(shown, ChannelShownFields.AGE),
                ChannelShownFields.visible(shown, ChannelShownFields.GENDER),
                ChannelShownFields.visible(shown, ChannelShownFields.NATIONALITY),
                ChannelShownFields.visible(shown, ChannelShownFields.RESIDENCE),
                anyVisible(shown, BIO_KEYS), anyVisible(shown, CAREER_KEYS),
                ChannelShownFields.visible(shown, ChannelShownFields.SNS),
                u.getGender(), u.getBirthDate() != null,
                ChannelPortfolioRules.ageBand(u.getBirthDate(), MinorPolicyService.today()), mv,
                consents.latest(u.getId()), guardians.mine(u.getId()).orElse(null), consents.termsVersion());
    }

    private static boolean anyVisible(String[] shown, List<String> keys) {
        for (String k : keys) {
            if (ChannelShownFields.visible(shown, k)) {
                return true;
            }
        }
        return false;
    }

    private static boolean anyShown(Patch p) {
        return p.showAge() != null || p.showGender() != null || p.showNationality() != null || p.showResidence() != null
                || p.showBio() != null || p.showCareer() != null || p.showSns() != null;
    }

    private static void toggle(Set<String> shown, Boolean on, List<String> keys) {
        if (on == null) {
            return;
        }
        if (on) {
            shown.addAll(keys);
        } else {
            keys.forEach(shown::remove);
        }
    }

    private User requireUser() {
        UUID id = SecurityUtils.getCurrentUserId();
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "LOGIN_REQUIRED");
        }
        return users.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "LOGIN_REQUIRED"));
    }
}
