package com.audition.platform.infrastructure.social;

import com.audition.platform.domain.entity.User;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SocialUserInfo {
    private String providerId;
    private String email;
    private String name;
    private String profileImageUrl;
    private User.Provider provider;
}
