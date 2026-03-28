package com.audition.platform.api.dto.channel;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class PostChannelVideoCommentRequest {

    @NotBlank(message = "댓글 내용이 필요합니다.")
    @Size(max = 4000, message = "댓글은 4000자 이하여야 합니다.")
    private String content;

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
