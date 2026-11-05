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
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
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

    /**
     * 유지할 태그는 지우지 않고, 빠진 것만 지운 뒤 없는 것만 넣는다.
     * 같은 키를 지웠다가 다시 넣으면 Hibernate 가 INSERT 를 DELETE 보다 먼저 flush 해
     * audition_tags_audition_tag_id_uniq 가 깨진다. 제거가 있으면 삽입 전에 flush 한다.
     */
    @Transactional
    public void replaceAuditionTags(UUID auditionId, List<String> tagIdStrings, List<String> customNames) {
        Map<UUID, Tag> desiredTags = loadActiveTags(tagIdStrings);
        Map<String, String> desiredCustoms = customLabels(customNames, desiredTags.values());
        Kept kept = new Kept();
        boolean removed = removeObsolete(auditionTagRepository.findByAuditionIdOrderByIdAsc(auditionId), desiredTags.keySet(), desiredCustoms, kept);
        if (removed) {
            auditionTagRepository.flush();
        }
        insertMissing(auditionId, desiredTags.keySet(), desiredCustoms, kept);
    }

    private Map<UUID, Tag> loadActiveTags(List<String> tagIdStrings) {
        Map<UUID, Tag> tags = new LinkedHashMap<>();
        for (UUID tagId : parseTagIds(tagIdStrings)) {
            if (tags.containsKey(tagId)) {
                continue;
            }
            Tag tag = tagRepository.findById(tagId)
                    .filter(Tag::isActive)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "태그를 찾을 수 없습니다: " + tagId));
            tags.put(tagId, tag);
        }
        return tags;
    }

    private static Map<String, String> customLabels(List<String> raw, Collection<Tag> catalog) {
        Map<String, String> labels = new LinkedHashMap<>();
        for (String value : raw != null ? raw : List.<String>of()) {
            String label = normalizeCustomLabel(value);
            if (label.isEmpty() || clashesCatalog(catalog, label)) {
                continue;
            }
            labels.putIfAbsent(label.toLowerCase(Locale.ROOT), label);
        }
        return labels;
    }

    private static boolean clashesCatalog(Collection<Tag> catalog, String label) {
        for (Tag tag : catalog) {
            if (tag.getName() != null && tag.getName().trim().equalsIgnoreCase(label)) {
                return true;
            }
        }
        return false;
    }

    private boolean removeObsolete(
            List<AuditionTag> existing,
            Set<UUID> desiredIds,
            Map<String, String> desiredCustoms,
            Kept kept) {
        boolean removed = false;
        for (AuditionTag row : existing) {
            if (row.getTagId() != null) {
                removed = removeCatalogRow(row, desiredIds, kept) || removed;
                continue;
            }
            removed = removeCustomRow(row, desiredCustoms, kept) || removed;
        }
        return removed;
    }

    private boolean removeCatalogRow(AuditionTag row, Set<UUID> desiredIds, Kept kept) {
        if (desiredIds.contains(row.getTagId()) && kept.tagIds.add(row.getTagId())) {
            return false;
        }
        auditionTagRepository.delete(row);
        return true;
    }

    private boolean removeCustomRow(AuditionTag row, Map<String, String> desiredCustoms, Kept kept) {
        String key = row.getTagName() == null ? "" : row.getTagName().trim().toLowerCase(Locale.ROOT);
        String label = desiredCustoms.get(key);
        if (label != null && kept.customKeys.add(key)) {
            if (!label.equals(row.getTagName())) {
                row.setTagName(label);
            }
            return false;
        }
        auditionTagRepository.delete(row);
        return true;
    }

    private void insertMissing(UUID auditionId, Set<UUID> desiredIds, Map<String, String> desiredCustoms, Kept kept) {
        for (UUID tagId : desiredIds) {
            if (kept.tagIds.contains(tagId)) {
                continue;
            }
            AuditionTag link = new AuditionTag();
            link.setAuditionId(auditionId);
            link.setTagId(tagId);
            link.setTagName(null);
            auditionTagRepository.save(link);
        }
        for (Map.Entry<String, String> custom : desiredCustoms.entrySet()) {
            if (kept.customKeys.contains(custom.getKey())) {
                continue;
            }
            AuditionTag link = new AuditionTag();
            link.setAuditionId(auditionId);
            link.setTagId(null);
            link.setTagName(custom.getValue());
            auditionTagRepository.save(link);
        }
    }

    private static final class Kept {
        private final Set<UUID> tagIds = new LinkedHashSet<>();
        private final Set<String> customKeys = new LinkedHashSet<>();
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
