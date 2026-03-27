package com.audition.platform.api;

import com.audition.platform.api.dto.TagResponse;
import com.audition.platform.domain.tag.Tag;
import com.audition.platform.domain.tag.TagRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 공고 등록·목록용 활성 태그 목록 (인증 불필요).
 */
@RestController
@RequestMapping("/api/tags")
public class TagCatalogController {

    private final TagRepository tagRepository;

    public TagCatalogController(TagRepository tagRepository) {
        this.tagRepository = tagRepository;
    }

    @GetMapping
    public List<TagResponse> listActive() {
        return tagRepository.findAllByActiveTrueOrderByTypeAscNameAsc().stream()
                .map(TagCatalogController::toPublicRow)
                .collect(Collectors.toList());
    }

    private static TagResponse toPublicRow(Tag t) {
        return new TagResponse(t.getId().toString(), t.getName(), t.getType(), t.isActive());
    }
}
