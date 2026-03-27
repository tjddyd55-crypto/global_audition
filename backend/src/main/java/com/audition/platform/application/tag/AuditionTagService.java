package com.audition.platform.application.tag;

import com.audition.platform.api.dto.AuditionTagRefDto;
import com.audition.platform.domain.audition.AuditionTagNormalizer;
import com.audition.platform.domain.tag.AuditionTag;
import com.audition.platform.domain.tag.AuditionTagRepository;
import com.audition.platform.domain.tag.Tag;
import com.audition.platform.domain.tag.TagRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuditionTagService {

    private static final int CUSTOM_MAX_LEN = 120;

    private final AuditionTagRepository auditionTagRepository;
    private final TagRepository tagRepository;

    public AuditionTagService(AuditionTagRepository auditionTagRepository, TagRepository tagRepository) {
        this.auditionTagRepository = auditionTagRepository;
        this.tagRepository = tagRepository;
    }

    public static String normalizeCustomLabel(String raw) {
        if (raw == null) {
            return "";
        }
        String t = raw.trim();
        if (t.length() > CUSTOM_MAX_LEN) {
            t = t.substring(0, CUSTOM_MAX_LEN).trim();
        }
        return t;
    }

    private static List<UUID> parseTagIds(List<String> raw) {
        if (raw == null || raw.isEmpty()) {
            return List.of();
        }
        List<UUID> out = new ArrayList<>();
        for (String s : raw) {
            if (s == null || s.isBlank()) {
                continue;
            }
            try {
                out.add(UUID.fromString(s.trim()));
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "유효하지 않은 tagId: " + s);
            }
        }
        return out;
    }

    @Transactional(readOnly = true)
    public List<String> resolveMergedDisplayNames(UUID auditionId) {
        List<AuditionTagRefDto> refs = listRefs(auditionId);
        List<String> names = new ArrayList<>();
        Set<String> seen = new LinkedHashSet<>();
        for (AuditionTagRefDto r : refs) {
            if (r.getName() == null || r.getName().isBlank()) {
                continue;
            }
            String n = r.getName().trim();
            if (seen.add(n.toLowerCase(Locale.ROOT))) {
                names.add(n);
            }
        }
        return names;
    }

    @Transactional(readOnly = true)
    public List<AuditionTagRefDto> listRefs(UUID auditionId) {
        List<AuditionTag> rows = auditionTagRepository.findByAuditionIdOrderByIdAsc(auditionId);
        List<AuditionTagRefDto> out = new ArrayList<>();
        for (AuditionTag row : rows) {
            if (row.getTagId() != null) {
                Optional<Tag> tag = tagRepository.findById(row.getTagId());
                if (tag.isEmpty()) {
                    continue;
                }
                out.add(new AuditionTagRefDto(row.getTagId().toString(), tag.get().getName()));
            } else if (row.getTagName() != null && !row.getTagName().isBlank()) {
                out.add(new AuditionTagRefDto(null, row.getTagName().trim()));
            }
        }
        return out;
    }

    @Transactional
    public void replaceAuditionTags(UUID auditionId, List<String> tagIdStrings, List<String> customNames) {
        List<UUID> tagIds = parseTagIds(tagIdStrings);
        auditionTagRepository.deleteByAuditionId(auditionId);

        LinkedHashSet<UUID> placedIds = new LinkedHashSet<>();
        for (UUID tid : tagIds) {
            if (placedIds.contains(tid)) {
                continue;
            }
            Tag tag = tagRepository.findById(tid)
                    .filter(Tag::isActive)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "태그를 찾을 수 없습니다: " + tid));
            placedIds.add(tid);
            AuditionTag link = new AuditionTag();
            link.setAuditionId(auditionId);
            link.setTagId(tag.getId());
            link.setTagName(null);
            auditionTagRepository.save(link);
        }

        LinkedHashSet<String> customKeys = new LinkedHashSet<>();
        for (String raw : customNames != null ? customNames : List.<String>of()) {
            String label = normalizeCustomLabel(raw);
            if (label.isEmpty()) {
                continue;
            }
            String key = label.toLowerCase(Locale.ROOT);
            if (!customKeys.add(key)) {
                continue;
            }
            boolean clashesCatalog = false;
            for (UUID id : placedIds) {
                Optional<Tag> t = tagRepository.findById(id);
                if (t.isPresent() && t.get().getName() != null
                        && t.get().getName().trim().equalsIgnoreCase(label)) {
                    clashesCatalog = true;
                    break;
                }
            }
            if (clashesCatalog) {
                continue;
            }
            AuditionTag link = new AuditionTag();
            link.setAuditionId(auditionId);
            link.setTagId(null);
            link.setTagName(label);
            auditionTagRepository.save(link);
        }
    }

    /**
     * 레거시 API: 허용 문자열 목록만 → 카탈로그에 이름이 있으면 tag_id, 없으면 스킵.
     */
    @Transactional
    public void replaceFromLegacyList(UUID auditionId, List<String> incoming) {
        String[] normalized = AuditionTagNormalizer.normalize(incoming);
        List<UUID> ids = new ArrayList<>();
        for (String n : normalized) {
            tagRepository.findFirstByNameIgnoreCaseAndActiveTrue(n).ifPresent(t -> ids.add(t.getId()));
        }
        replaceAuditionTags(auditionId, ids.stream().map(UUID::toString).collect(Collectors.toList()), List.of());
    }
}
