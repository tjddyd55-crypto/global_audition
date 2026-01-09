package com.audition.platform.application.dto;

import com.audition.platform.domain.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String email;
    private String name;
    private User.UserType userType;
    private String profileImageUrl;
    private LocalDateTime createdAt;
}
