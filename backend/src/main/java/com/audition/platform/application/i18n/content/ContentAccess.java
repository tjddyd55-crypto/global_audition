package com.audition.platform.application.i18n.content;

import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.user.UserRepository;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class ContentAccess {

    private final UserRepository users;
    private final ApplicationRepository applications;

    public ContentAccess(UserRepository users, ApplicationRepository applications) {
        this.users = users;
        this.applications = applications;
    }

    public boolean staff(UUID viewer) {
        if (viewer == null) {
            return false;
        }
        return users.findById(viewer)
                .map(user -> "ADMIN".equals(user.getRole()) || "SUPER_ADMIN".equals(user.getRole()))
                .orElse(false);
    }

    public boolean same(UUID viewer, UUID owner) {
        return viewer != null && viewer.equals(owner);
    }

    public boolean agencyOfApplicant(UUID viewer, UUID applicantId) {
        if (viewer == null || applicantId == null) {
            return false;
        }
        return applications.existsForApplicantAndAgency(applicantId, viewer);
    }
}
