package com.audition.platform.application.dto;

import com.audition.platform.domain.entity.VideoContent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateVideoRequest {
    @NotBlank(message = "제목은 필수입니다")
    private String title;

    private String description;

    @NotBlank(message = "비디오 URL은 필수입니다")
    private String videoUrl;

    private String thumbnailUrl;

    private Integer duration;

    private VideoContent.VideoCategory category;

    private VideoContent.VideoType videoType; // ORIGINAL(자작곡), COMPOSITION(작곡곡), COVER(커버곡)

    private VideoContent.Visibility visibility; // PUBLIC, PRIVATE, FOLLOWERS_ONLY

    @NotNull(message = "상태는 필수입니다")
    private VideoContent.VideoStatus status;
}
