package com.audition.platform.application.i18n.translation;

import java.net.InetAddress;
import java.util.List;

/** 호출 시점 DNS. 구현은 캐시하지 않는다. */
public interface DnsResolver {

    List<InetAddress> resolve(String host);
}
