package com.audition.platform.application.i18n.translation;

/**
 * 서버 메모리에서만 쓰는 Google 설정. 자격 증명은 toString 과 API 응답에 넣지 않는다.
 */
public record GoogleRuntime(
        String projectId,
        String location,
        String model,
        String credentialsJson,
        boolean configured) {

    @Override
    public String toString() {
        return "GoogleRuntime[projectId=" + projectId
                + ", location=" + location
                + ", model=" + model
                + ", configured=" + configured
                + ", credentials=hidden]";
    }
}
