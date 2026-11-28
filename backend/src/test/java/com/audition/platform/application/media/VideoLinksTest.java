package com.audition.platform.application.media;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.web.server.ResponseStatusException;

import java.net.InetAddress;
import java.net.URI;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class VideoLinksTest {
    private static final String VIDEO = "https://www.bilibili.com/video/BV1B7411m7LV";
    private static final URI SHORT = URI.create("https://b23.tv/Example");

    @Test
    void canonicalizesVideoLinksAndPreservesThePart() {
        assertThat(VideoLinks.embeddable("Watch https://m.bilibili.com/video/BV1B7411m7LV?share=1&p=2")).isEqualTo(VIDEO + "?p=2");
        assertThat(VideoLinks.embeddable("https://bilibili.com/video/av12345/?p=1"))
                .isEqualTo("https://www.bilibili.com/video/av12345");
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ",
            "https://www.youtube.com/shorts/dQw4w9WgXcQ", "https://youtu.be/dQw4w9WgXcQ",
            "https://vm.tiktok.com/Z123/", "https://www.instagram.com/reel/ABC/"
    })
    void preservesPreviouslySupportedApplicationLinks(String url) {
        assertThat(VideoLinks.audition(url)).isEqualTo(url);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "https://wrong.test/youtube.com/watch?v=dQw4w9WgXcQ", "https://notyoutube.com/shorts/dQw4w9WgXcQ",
            "https://www.bilibili.com.wrong.test/video/BV1B7411m7LV", "https://www.bilibili.com@wrong.test/video/BV1B7411m7LV",
            "https://www.bilibili.com:443/video/BV1B7411m7LV", "http://b23.tv/Example", "https://b23.tv/",
            "https://www.bilibili.com/video/BVbad", "https://www.bilibili.com/video/BV1B7411m7LV?p=0",
            "https://www.bilibili.com/video/BV1B7411m7LV?p=2&p=3", "https://www.bilibili.com/search",
            "<iframe src='https://www.bilibili.com/video/BV1B7411m7LV'></iframe>",
            "javascript:alert(1)", "file:///video.mp4"
    })
    void rejectsUnsupportedAndDeceptiveLinks(String url) {
        assertThatThrownBy(() -> VideoLinks.audition(url)).isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void acceptsOnlyTheCanonicalDestinationWithoutFetchingIt() throws Exception {
        AtomicInteger requests = new AtomicInteger();
        var result = VideoLinks.resolve(SHORT, uri -> requests.incrementAndGet() == 1 ? "/Next" : VIDEO + "?p=2");
        assertThat(result.url()).isEqualTo(VIDEO + "?p=2");
        assertThat(requests).hasValue(2);
    }

    @ParameterizedTest
    @ValueSource(strings = {"https://example.org/other", "https://127.0.0.1/video/BV1B7411m7LV",
            "https://www.bilibili.com/search", "http://b23.tv/Other", "https://b23.tv:8443/Other"})
    void rejectsRedirectOutsideTheAllowlist(String location) throws Exception {
        AtomicInteger requests = new AtomicInteger();
        assertThat(VideoLinks.resolve(SHORT, uri -> {
            requests.incrementAndGet();
            return location;
        })).isNull();
        assertThat(requests).hasValue(1);
    }

    @Test
    void stopsRedirectLoops() throws Exception {
        AtomicInteger requests = new AtomicInteger();
        assertThat(VideoLinks.resolve(SHORT, uri -> {
            requests.incrementAndGet();
            return "/Example";
        })).isNull();
        assertThat(requests).hasValue(3);
    }

    @ParameterizedTest
    @ValueSource(strings = {"127.0.0.1", "10.0.0.1", "172.16.0.1", "192.168.1.1", "100.64.0.1", "169.254.169.254", "::1", "fc00::1"})
    void refusesInternalDnsResults(String address) throws Exception {
        assertThat(VideoLinks.publicIpv4(InetAddress.getByName(address))).isFalse();
    }
}
