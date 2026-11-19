package com.audition.platform.application.channel;

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
 * 수신: 본인이 켠 지원자 + 생년월일로 성인 확인 + 활성 계정. 미성년자·생년월일 미입력은 받지 않는다
 * (보호자 동의 정책이 정해지기 전까지의 보호 조치).
 * 발송: 승인(APPROVED)·활성(ACTIVE) 지점이 있고 정지(SUSPENDED) 지점이 없는 기획사 계정.
 */
@Component
public class CastingOfferEligibility {

    private final JdbcCrmStore crm;
    private final UserRepository users;

    public CastingOfferEligibility(JdbcCrmStore crm, UserRepository users) {
        this.crm = crm;
        this.users = users;
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
                && ChannelPortfolioRules.confirmedAdult(target.getBirthDate(), today());
    }

    public void requireCanEnable(User user) {
        if (user.getBirthDate() == null) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "CASTING_BIRTH_DATE_REQUIRED");
        }
        if (!ChannelPortfolioRules.confirmedAdult(user.getBirthDate(), today())) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "CASTING_MINOR_RESTRICTED");
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
