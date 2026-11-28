package com.audition.platform.api;

import com.audition.platform.application.media.VideoLinks;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/me/video-links")
public class VideoLinkController {
    public record ResolveRequest(@NotBlank @Size(max = 2048) String url) {}

    @PostMapping("/resolve")
    public Map<String, String> resolve(@Valid @RequestBody ResolveRequest request) {
        return Map.of("url", VideoLinks.bilibili(request.url()));
    }
}
