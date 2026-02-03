package com.audition.platform.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploadImageResponse {
    private String imageUrl; // 업로드된 이미지 URL
    private String imageKey; // 저장된 이미지 키 (나중에 삭제/수정용)
}
