package com.audition.platform.application.i18n.translation;

import com.audition.platform.domain.audition.AuditionTranslation;
import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.List;

@Component
public class InetDnsResolver implements DnsResolver {

    @Override
    public List<InetAddress> resolve(String host) {
        try {
            return List.of(InetAddress.getAllByName(host));
        } catch (UnknownHostException ex) {
            throw new TranslationProviderException(
                    AuditionTranslation.ERROR_ENDPOINT_REJECTED,
                    "번역 엔드포인트의 DNS를 확인하지 못했습니다.");
        }
    }
}
