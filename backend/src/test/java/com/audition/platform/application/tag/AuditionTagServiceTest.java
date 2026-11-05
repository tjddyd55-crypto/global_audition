package com.audition.platform.application.tag;

import com.audition.platform.domain.tag.AuditionTag;
import com.audition.platform.domain.tag.AuditionTagRepository;
import com.audition.platform.domain.tag.Tag;
import com.audition.platform.domain.tag.TagRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuditionTagServiceTest {

    private AuditionTagRepository auditionTagRepository;
    private TagRepository tagRepository;
    private AuditionTagService service;
    private UUID auditionId;

    @BeforeEach
    void setUp() {
        auditionTagRepository = mock(AuditionTagRepository.class);
        tagRepository = mock(TagRepository.class);
        service = new AuditionTagService(auditionTagRepository, tagRepository);
        auditionId = UUID.randomUUID();
        when(auditionTagRepository.findByAuditionIdOrderByIdAsc(auditionId)).thenReturn(List.of());
    }

    @Test
    void keepingTheSameTagsDoesNotDeleteOrInsert() {
        UUID tagId = UUID.randomUUID();
        stubTag(tagId, "Vocal");
        when(auditionTagRepository.findByAuditionIdOrderByIdAsc(auditionId))
                .thenReturn(List.of(link(auditionId, tagId, null)));

        service.replaceAuditionTags(auditionId, List.of(tagId.toString()), List.of());

        verify(auditionTagRepository, never()).delete(any());
        verify(auditionTagRepository, never()).flush();
        verify(auditionTagRepository, never()).save(any());
    }

    @Test
    void addingATagInsertsOnlyTheNewLink() {
        UUID kept = UUID.randomUUID();
        UUID added = UUID.randomUUID();
        stubTag(kept, "Vocal");
        stubTag(added, "Dance");
        when(auditionTagRepository.findByAuditionIdOrderByIdAsc(auditionId))
                .thenReturn(List.of(link(auditionId, kept, null)));

        service.replaceAuditionTags(auditionId, List.of(kept.toString(), added.toString()), List.of());

        ArgumentCaptor<AuditionTag> saved = ArgumentCaptor.forClass(AuditionTag.class);
        verify(auditionTagRepository, times(1)).save(saved.capture());
        assertEquals(added, saved.getValue().getTagId());
        assertEquals(auditionId, saved.getValue().getAuditionId());
        verify(auditionTagRepository, never()).delete(any());
        verify(auditionTagRepository, never()).flush();
    }

    @Test
    void removingATagFlushesTheDeleteBeforeAnyInsert() {
        UUID kept = UUID.randomUUID();
        UUID removed = UUID.randomUUID();
        UUID added = UUID.randomUUID();
        stubTag(kept, "Vocal");
        stubTag(removed, "Dance");
        stubTag(added, "Actor");
        AuditionTag removedRow = link(auditionId, removed, null);
        when(auditionTagRepository.findByAuditionIdOrderByIdAsc(auditionId))
                .thenReturn(List.of(link(auditionId, kept, null), removedRow));

        service.replaceAuditionTags(auditionId, List.of(kept.toString(), added.toString()), List.of());

        InOrder order = inOrder(auditionTagRepository);
        order.verify(auditionTagRepository).delete(removedRow);
        order.verify(auditionTagRepository).flush();
        order.verify(auditionTagRepository).save(any(AuditionTag.class));
    }

    @Test
    void emptyRequestRemovesEveryTag() {
        UUID tagId = UUID.randomUUID();
        AuditionTag row = link(auditionId, tagId, null);
        AuditionTag custom = link(auditionId, null, "Free");
        when(auditionTagRepository.findByAuditionIdOrderByIdAsc(auditionId)).thenReturn(List.of(row, custom));

        service.replaceAuditionTags(auditionId, List.of(), List.of());

        verify(auditionTagRepository).delete(row);
        verify(auditionTagRepository).delete(custom);
        verify(auditionTagRepository).flush();
        verify(auditionTagRepository, never()).save(any());
    }

    @Test
    void duplicateTagIdsAndNamesAreStoredOnce() {
        UUID tagId = UUID.randomUUID();
        stubTag(tagId, "Vocal");

        service.replaceAuditionTags(
                auditionId,
                List.of(tagId.toString(), tagId.toString()),
                List.of(" Dance ", "dance", "DANCE", "vocal"));

        ArgumentCaptor<AuditionTag> saved = ArgumentCaptor.forClass(AuditionTag.class);
        verify(auditionTagRepository, times(2)).save(saved.capture());
        AuditionTag catalog = saved.getAllValues().get(0);
        AuditionTag custom = saved.getAllValues().get(1);
        assertEquals(tagId, catalog.getTagId());
        assertNull(catalog.getTagName());
        assertNull(custom.getTagId());
        assertEquals("Dance", custom.getTagName());
    }

    @Test
    void unknownTagIsRejectedBeforeAnyDelete() {
        UUID missing = UUID.randomUUID();
        when(tagRepository.findById(missing)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.replaceAuditionTags(auditionId, List.of(missing.toString()), List.of("Dance")));

        assertEquals(422, ex.getStatusCode().value());
        verify(auditionTagRepository, never()).findByAuditionIdOrderByIdAsc(any());
        verify(auditionTagRepository, never()).delete(any());
    }

    private void stubTag(UUID id, String name) {
        Tag tag = new Tag();
        tag.setId(id);
        tag.setName(name);
        tag.setActive(true);
        when(tagRepository.findById(id)).thenReturn(Optional.of(tag));
    }

    private static AuditionTag link(UUID auditionId, UUID tagId, String customName) {
        AuditionTag row = new AuditionTag();
        row.setId(UUID.randomUUID());
        row.setAuditionId(auditionId);
        row.setTagId(tagId);
        row.setTagName(customName);
        return row;
    }
}
