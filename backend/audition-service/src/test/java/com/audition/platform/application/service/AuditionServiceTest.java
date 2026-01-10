package com.audition.platform.application.service;

import com.audition.platform.application.dto.AuditionDto;
import com.audition.platform.application.dto.CreateAuditionRequest;
import com.audition.platform.domain.entity.Audition;
import com.audition.platform.domain.repository.AuditionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditionServiceTest {

    @Mock
    private AuditionRepository auditionRepository;

    @Mock
    private com.audition.platform.application.mapper.AuditionMapper auditionMapper;

    @InjectMocks
    private AuditionService auditionService;

    private Audition testAudition;

    @BeforeEach
    void setUp() {
        testAudition = Audition.builder()
                .id(1L)
                .title("테스트 오디션")
                .status(Audition.AuditionStatus.ONGOING)
                .category(Audition.AuditionCategory.SINGER)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(30))
                .businessId(1L)
                .build();
    }

    @Test
    void shouldGetAuditions() {
        // given
        List<Audition> auditions = Arrays.asList(testAudition);
        Page<Audition> page = new PageImpl<>(auditions);
        AuditionDto dto = AuditionDto.builder()
                .id(1L)
                .title("테스트 오디션")
                .build();

        when(auditionRepository.findByStatusIn(any(), any(PageRequest.class)))
                .thenReturn(page);
        when(auditionMapper.toDto(any(Audition.class))).thenReturn(dto);

        // when
        Page<AuditionDto> result = auditionService.getAuditions(null, null, PageRequest.of(0, 20));

        // then
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getTitle()).isEqualTo("테스트 오디션");
    }

    @Test
    void shouldGetAuditionById() {
        // given
        AuditionDto dto = AuditionDto.builder()
                .id(1L)
                .title("테스트 오디션")
                .build();

        when(auditionRepository.findById(1L)).thenReturn(Optional.of(testAudition));
        when(auditionMapper.toDto(testAudition)).thenReturn(dto);

        // when
        AuditionDto result = auditionService.getAuditionById(1L);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getTitle()).isEqualTo("테스트 오디션");
    }

    @Test
    void shouldThrowExceptionWhenAuditionNotFound() {
        // given
        when(auditionRepository.findById(999L)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> auditionService.getAuditionById(999L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Audition not found");
    }

    @Test
    void shouldCreateAudition() {
        // given
        CreateAuditionRequest request = new CreateAuditionRequest();
        request.setTitle("새 오디션");
        request.setCategory(Audition.AuditionCategory.DANCER);
        request.setStartDate(LocalDate.now());
        request.setEndDate(LocalDate.now().plusDays(30));

        Audition savedAudition = Audition.builder()
                .id(2L)
                .title("새 오디션")
                .status(Audition.AuditionStatus.WRITING)
                .build();

        AuditionDto dto = AuditionDto.builder()
                .id(2L)
                .title("새 오디션")
                .build();

        when(auditionRepository.save(any(Audition.class))).thenReturn(savedAudition);
        when(auditionMapper.toDto(savedAudition)).thenReturn(dto);

        // when
        AuditionDto result = auditionService.createAudition(1L, request);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getTitle()).isEqualTo("새 오디션");
        verify(auditionRepository, times(1)).save(any(Audition.class));
    }

    @Test
    void shouldDeleteAudition() {
        // given
        when(auditionRepository.existsById(1L)).thenReturn(true);

        // when
        auditionService.deleteAudition(1L);

        // then
        verify(auditionRepository, times(1)).deleteById(1L);
    }
}
