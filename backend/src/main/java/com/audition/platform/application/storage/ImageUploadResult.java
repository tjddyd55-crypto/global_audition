package com.audition.platform.application.storage;

/** R2 업로드 결과 — DB·클라이언트는 원본 URL 위주로 저장, 파생은 선택 표시용 */
public record ImageUploadResult(String originalUrl, String mediumUrl, String thumbUrl) {
}
