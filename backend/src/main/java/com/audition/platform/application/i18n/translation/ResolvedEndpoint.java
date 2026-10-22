package com.audition.platform.application.i18n.translation;

import java.net.InetAddress;
import java.util.List;

/** 허용 목록과 공개 IP 검사를 통과한 호출 대상. IP 는 이 해석 결과에 고정한다. */
public record ResolvedEndpoint(String host, int port, String pathAndQuery, List<InetAddress> addresses) {
}
