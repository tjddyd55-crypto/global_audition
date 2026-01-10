package com.audition.platform.presentation.controller;

import com.audition.platform.application.dto.AuditionDto;
import com.audition.platform.application.service.AuditionService;
import com.audition.platform.domain.entity.Audition;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.Arrays;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
        controllers = AuditionController.class,
        excludeAutoConfiguration = {
                org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class,
                org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration.class,
                org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration.class,
                org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration.class,
                org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration.class
        },
        excludeFilters = {
                @ComponentScan.Filter(
                        type = FilterType.ASSIGNABLE_TYPE,
                        classes = {
                                com.audition.platform.AuditionServiceApplication.class,
                                com.audition.platform.config.JpaAuditingConfig.class,
                                com.audition.platform.presentation.config.SecurityConfig.class
                        }
                )
        }
)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class AuditionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuditionService auditionService;

    @MockBean
    private com.audition.platform.infrastructure.security.JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private com.audition.platform.infrastructure.security.JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldGetAuditions() throws Exception {
        // given
        AuditionDto dto = AuditionDto.builder()
                .id(1L)
                .title("테스트 오디션")
                .status(Audition.AuditionStatus.ONGOING)
                .build();
        Page<AuditionDto> page = new PageImpl<>(Arrays.asList(dto), PageRequest.of(0, 20), 1);

        when(auditionService.getAuditions(any(), any(), any(PageRequest.class)))
                .thenReturn(page);

        // when & then
        mockMvc.perform(get("/api/v1/auditions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").exists())
                .andExpect(jsonPath("$.content[0].title").value("테스트 오디션"));
    }

    @Test
    void shouldGetAuditionById() throws Exception {
        // given
        AuditionDto dto = AuditionDto.builder()
                .id(1L)
                .title("테스트 오디션")
                .status(Audition.AuditionStatus.ONGOING)
                .build();

        when(auditionService.getAuditionById(1L)).thenReturn(dto);

        // when & then
        mockMvc.perform(get("/api/v1/auditions/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("테스트 오디션"));
    }

    @Test
    void shouldCreateAudition() throws Exception {
        // given
        com.audition.platform.application.dto.CreateAuditionRequest request =
                new com.audition.platform.application.dto.CreateAuditionRequest();
        request.setTitle("새 오디션");
        request.setCategory(Audition.AuditionCategory.SINGER);
        request.setStartDate(LocalDate.now());
        request.setEndDate(LocalDate.now().plusDays(30));

        AuditionDto created = AuditionDto.builder()
                .id(1L)
                .title("새 오디션")
                .build();

        when(auditionService.createAudition(any(Long.class), any())).thenReturn(created);

        // when & then
        mockMvc.perform(post("/api/v1/auditions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("새 오디션"));
    }
}
