package com.audition.platform.application.org;

import java.util.UUID;

public interface OrgDirectory {

    String roleOf(UUID userId);

    String activeRepCountry(UUID userId);

    String activeStaffCountry(UUID userId);

    boolean staffHas(UUID userId, String countryCode, String permission);

    boolean staffAssigned(UUID userId, String countryCode, UUID crmAgencyId);
}
