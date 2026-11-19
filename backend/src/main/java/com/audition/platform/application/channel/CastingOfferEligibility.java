package com.audition.platform.application.channel;

import com.audition.platform.application.consent.MinorPolicyService;
import com.audition.platform.application.org.AgencyApproval;
import com.audition.platform.application.org.JdbcCrmStore;
import com.audition.platform.application.org.JdbcCrmStore.AgencyRow;
import com.audition.platform.application.org.OrgRoles;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

/**
 * 캐스팅 제안 수신·발송 자격.
 * 수신: 본인이 켠 지원자 + 활성 계정 + 국가별 미성년자 정책(country_minor_policies) 충족.
 * 성인은 기존 구조 그대로. 미성년자는 국가 정책상 보호자 확인이 완료된 경우에만 플랫폼 내 공식 제안을 받는다.
 * 생년월일이 없으면 정책을 적용할 수 없어 받지 않는다.
 * 발송: 승인(APPROVED)·활성(ACTIVE) 지점이 있고 정지(SUSPENDED) 지점이 없는 기획사 계정.
 */
@Component
public class CastingOfferEligibility {

    private final JdbcCrmStore crm;
    private final UserRepository users;
    private final MinorPolicyService minorPolicy;

    public CastingOfferEligibility(JdbcCrmStore crm, UserRepository users, MinorPolicyService minorPolicy) {
        this.crm = crm;
        this.users = users;
        this.minorPolicy = minorPolicy;
    }

    public static LocalDate today() {
        return LocalDate.now(ZoneOffset.UTC);
    }

    public boolean receivable(User target) {
        return target != null
                && "APPLICANT".equals(target.getRole())
                && target.isCastingOffersEnabled()
                && !target.isChannelModerationHidden()
                && "ACTIVE".equals(target.getAccountStatus() == null ? "ACTIVE" : target.getAccountStatus())
                && minorPolicy.status(target).offersAllowed();
    }

    public void requireCanEnable(User user) {
        String reason = minorPolicy.status(user).offersBlockReason();
        if (reason != null) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, reason);
        }
    }

    public boolean approvedAgency(UUID userId) {
        if (userId == null) {
            return false;
        }
        User u = users.findById(userId).orElse(null);
        if (u == null || !OrgRoles.agencyOperator(u.getRole())
                || !"ACTIVE".equals(u.getAccountStatus() == null ? "ACTIVE" : u.getAccountStatus())) {
            return false;
        }
        List<AgencyRow> rows = crm.findByLinkedUser(userId);
        boolean suspended = rows.stream().anyMatch(r -> AgencyApproval.SUSPENDED.equals(r.approvalState()));
        boolean approved = rows.stream().anyMatch(r -> AgencyApproval.APPROVED.equals(r.approvalState())
                && "ACTIVE".equals(r.stage()));
        return approved && !suspended;
    }

    public List<AgencyRow> approvedBranches(UUID userId) {
        return crm.findByLinkedUser(userId).stream()
                .filter(r -> AgencyApproval.APPROVED.equals(r.approvalState()) && "ACTIVE".equals(r.stage()))
                .toList();
    }

    public boolean canSendTo(UUID agencyUserId, User target) {
        return receivable(target) && approvedAgency(agencyUserId);
    }
}
