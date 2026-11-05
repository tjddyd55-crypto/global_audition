package com.audition.platform.application.round;

import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRound;
import com.audition.platform.domain.audition.AuditionRoundNotification;
import com.audition.platform.domain.audition.AuditionRoundNotificationRepository;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * 실제 발송 전 — 알림 로그·템플릿 페이로드 적재.
 */
@Service
public class RoundNotificationService {

    private final AuditionRoundNotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public RoundNotificationService(
            AuditionRoundNotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void logPassNotice(Application application, AuditionRound round) {
        save(application, round, "PASS_NOTICE", Map.of(
                "title", "라운드 합격 안내",
                "body", "축하합니다. 다음 라운드 안내를 확인해 주세요."));
    }

    @Transactional
    public void logFailNotice(Application application, AuditionRound round) {
        save(application, round, "FAIL_NOTICE", Map.of(
                "title", "라운드 결과 안내",
                "body", "아쉽게도 이번 라운드에서는 진행이 어렵습니다."));
    }

    /**
     * 단일 단계 오디션의 합격/불합격. 지원서 id + 결과(알림 타입)로 한 번만 넣는다.
     * 다단계 심사는 {@link #logPassNotice} / {@link #logFailNotice} 가 담당한다.
     */
    @Transactional
    public void logSingleStageDecision(Application application, Audition audition, String dbStatus) {
        if (application == null || application.getId() == null || audition == null) {
            return;
        }
        if (AuditionProcessModes.isMultiRound(audition.getProcessMode())) {
            return;
        }
        String type = singleStageType(dbStatus);
        if (type == null || alreadyLogged(application.getId(), type)) {
            return;
        }
        notificationRepository.save(singleStageNotice(application, type, "ACCEPTED".equals(dbStatus)));
    }

    @Transactional
    public void logRoundOpen(UUID auditionId, AuditionRound round) {
        AuditionRoundNotification n = new AuditionRoundNotification();
        n.setAuditionId(auditionId);
        n.setRoundId(round.getId());
        n.setApplicationId(null);
        n.setNotificationType("ROUND_OPEN");
        n.setChannel("IN_APP");
        n.setStatus("PENDING");
        n.setPayloadJson(Map.of(
                "title", round.getRoundName() + " 오픈",
                "body", round.getAnnouncementBody() != null ? round.getAnnouncementBody() : ""));
        notificationRepository.save(n);
    }

    private static String singleStageType(String dbStatus) {
        if ("ACCEPTED".equals(dbStatus)) {
            return "PASS_NOTICE";
        }
        if ("REJECTED".equals(dbStatus)) {
            return "FAIL_NOTICE";
        }
        return null;
    }

    private boolean alreadyLogged(UUID applicationId, String type) {
        return notificationRepository.existsByApplicationIdAndNotificationTypeAndChannelAndRoundIdIsNull(
                applicationId, type, "IN_APP");
    }

    private AuditionRoundNotification singleStageNotice(Application application, String type, boolean passed) {
        AuditionRoundNotification notice = new AuditionRoundNotification();
        notice.setAuditionId(application.getAuditionId());
        notice.setRoundId(null);
        notice.setApplicationId(application.getId());
        notice.setNotificationType(type);
        notice.setChannel("IN_APP");
        notice.setStatus("PENDING");
        notice.setPayloadJson(singleStagePayload(passed));
        copyApplicantEmail(application, notice);
        return notice;
    }

    private static Map<String, Object> singleStagePayload(boolean passed) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("titleKey", passed ? "singleStagePassTitle" : "singleStageFailTitle");
        payload.put("bodyKey", passed ? "singleStagePassBody" : "singleStageFailBody");
        payload.put("result", passed ? "ACCEPTED" : "REJECTED");
        return payload;
    }

    private void copyApplicantEmail(Application application, AuditionRoundNotification notice) {
        UUID applicantId = application.getApplicantId();
        if (applicantId == null) {
            return;
        }
        userRepository.findById(applicantId).map(User::getEmail).ifPresent(notice::setTargetEmail);
    }

    private void save(Application application, AuditionRound round, String type, Map<String, Object> payload) {
        AuditionRoundNotification n = new AuditionRoundNotification();
        n.setAuditionId(application.getAuditionId());
        n.setRoundId(round.getId());
        n.setApplicationId(application.getId());
        n.setNotificationType(type);
        n.setChannel("IN_APP");
        n.setStatus("PENDING");
        n.setPayloadJson(payload);
        copyApplicantEmail(application, n);
        notificationRepository.save(n);
    }
}
