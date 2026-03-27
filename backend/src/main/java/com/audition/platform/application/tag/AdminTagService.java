package com.audition.platform.application.tag;

import com.audition.platform.api.dto.TagCreateRequest;
import com.audition.platform.api.dto.TagPatchRequest;
import com.audition.platform.api.dto.TagResponse;
import com.audition.platform.application.credit.SuperAdminAuthHelper;
import com.audition.platform.domain.tag.Tag;
import com.audition.platform.domain.tag.TagRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AdminTagService {

    private final TagRepository tagRepository;

    public AdminTagService(TagRepository tagRepository) {
        this.tagRepository = tagRepository;
    }

    @Transactional(readOnly = true)
    public List<TagResponse> listAll() {
        SuperAdminAuthHelper.requireSuperAdmin();
        return tagRepository.findAllByOrderByTypeAscNameAsc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public TagResponse create(TagCreateRequest req) {
        SuperAdminAuthHelper.requireSuperAdmin();
        String name = req.getName().trim();
        if (name.length() > 80) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "태그 이름은 80자 이하여야 합니다.");
        }
        if (tagRepository.findFirstByNameIgnoreCase(name).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 동일한 이름의 태그가 있습니다.");
        }
        Tag t = new Tag();
        t.setName(name);
        t.setType(req.getType());
        t.setActive(true);
        t = tagRepository.save(t);
        return toResponse(t);
    }

    @Transactional
    public TagResponse patch(UUID id, TagPatchRequest req) {
        SuperAdminAuthHelper.requireSuperAdmin();
        Tag t = tagRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "태그를 찾을 수 없습니다."));
        if (req.getName() != null) {
            String name = req.getName().trim();
            if (name.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "이름이 비어 있습니다.");
            }
            if (name.length() > 80) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "태그 이름은 80자 이하여야 합니다.");
            }
            String nameFinal = name;
            boolean taken = tagRepository.findAllByOrderByTypeAscNameAsc().stream()
                    .anyMatch(x -> !x.getId().equals(id) && x.getName().equalsIgnoreCase(nameFinal));
            if (taken) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 동일한 이름의 태그가 있습니다.");
            }
            t.setName(name);
        }
        if (req.getType() != null && !req.getType().equals(t.getType())) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "태그 유형은 변경할 수 없습니다.");
        }
        if (req.getActive() != null) {
            t.setActive(req.getActive());
        }
        return toResponse(tagRepository.save(t));
    }

    @Transactional
    public void deactivate(UUID id) {
        SuperAdminAuthHelper.requireSuperAdmin();
        Tag t = tagRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "태그를 찾을 수 없습니다."));
        t.setActive(false);
        tagRepository.save(t);
    }

    private TagResponse toResponse(Tag t) {
        return new TagResponse(
                t.getId().toString(),
                t.getName(),
                t.getType(),
                t.isActive()
        );
    }
}
