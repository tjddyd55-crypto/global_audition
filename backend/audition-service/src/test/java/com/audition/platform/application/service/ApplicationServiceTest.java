package com.audition.platform.application.service;

import com.audition.platform.application.dto.ApplicationDto;
import com.audition.platform.application.dto.CreateApplicationRequest;
import com.audition.platform.domain.entity.Application;
import com.audition.platform.domain.entity.Audition;
import com.audition.platform.domain.repository.ApplicationRepository;
import com.audition.platform.domain.repository.AuditionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApplicationServiceTest {

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private AuditionRepository auditionRepository;

    @Mock
    private com.audition.platform.application.mapper.ApplicationMapper applicationMapper;

    @InjectMocks
    private ApplicationService applicationService;

    private Audition testAudition;
    private Application testApplication;

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

        testApplication = Application.builder()
                .id(1L)
                .audition(testAudition)
                .userId(1L)
                .status(Application.ApplicationStatus.APPLICATION_COMPLETED)
                .build();
    }

    @Test
    void shouldCreateApplication() {
        // given
        CreateApplicationRequest request = new CreateApplicationRequest();
        request.setAuditionId(1L);
        request.setVideoId1(100L);

        Application savedApplication = Application.builder()
                .id(1L)
                .userId(1L)
                .status(Application.ApplicationStatus.WRITING)
                .build();

        ApplicationDto dto = ApplicationDto.builder()
                .id(1L)
                .status(Application.ApplicationStatus.WRITING)
                .build();

        when(auditionRepository.findById(1L)).thenReturn(Optional.of(testAudition));
        when(applicationRepository.findByUserIdAndAuditionId(1L, 1L))
                .thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(savedApplication);
        when(applicationMapper.toDto(savedApplication)).thenReturn(dto);

        // when
        ApplicationDto result = applicationService.createApplication(1L, request);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(Application.ApplicationStatus.WRITING);
        verify(applicationRepository, times(1)).save(any(Application.class));
    }

    @Test
    void shouldThrowExceptionWhenAlreadyApplied() {
        // given
        CreateApplicationRequest request = new CreateApplicationRequest();
        request.setAuditionId(1L);

        when(auditionRepository.findById(1L)).thenReturn(Optional.of(testAudition));
        when(applicationRepository.findByUserIdAndAuditionId(1L, 1L))
                .thenReturn(Optional.of(testApplication));

        // when & then
        assertThatThrownBy(() -> applicationService.createApplication(1L, request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Already applied");
    }

    @Test
    void shouldUpdateScreeningResult1() {
        // given
        com.audition.platform.application.dto.UpdateScreeningResultRequest request =
                new com.audition.platform.application.dto.UpdateScreeningResultRequest();
        request.setResult(Application.ScreeningResult.PASS);

        ApplicationDto dto = ApplicationDto.builder()
                .id(1L)
                .result1(Application.ScreeningResult.PASS)
                .build();

        when(applicationRepository.findById(1L)).thenReturn(Optional.of(testApplication));
        when(applicationRepository.save(any(Application.class))).thenReturn(testApplication);
        when(applicationMapper.toDto(testApplication)).thenReturn(dto);

        // when
        ApplicationDto result = applicationService.updateScreeningResult1(1L, request);

        // then
        assertThat(result.getResult1()).isEqualTo(Application.ScreeningResult.PASS);
        verify(applicationRepository, times(1)).save(any(Application.class));
    }
}
