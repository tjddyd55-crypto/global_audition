package com.audition.platform.domain.repository;

import com.audition.platform.domain.entity.Audition;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Import(com.audition.platform.config.JpaAuditingConfig.class)
@ActiveProfiles("test")
class AuditionRepositoryTest {

    @Autowired
    private AuditionRepository auditionRepository;

    @Test
    void shouldSaveAndFindAudition() {
        // given
        Audition audition = Audition.builder()
                .title("테스트 오디션")
                .titleEn("Test Audition")
                .status(Audition.AuditionStatus.ONGOING)
                .category(Audition.AuditionCategory.SINGER)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(30))
                .businessId(1L)
                .build();

        // when
        Audition saved = auditionRepository.save(audition);
        Audition found = auditionRepository.findById(saved.getId()).orElse(null);

        // then
        assertThat(found).isNotNull();
        assertThat(found.getTitle()).isEqualTo("테스트 오디션");
        assertThat(found.getStatus()).isEqualTo(Audition.AuditionStatus.ONGOING);
    }

    @Test
    void shouldFindByStatusIn() {
        // given
        Audition audition1 = createAudition("오디션1", Audition.AuditionStatus.ONGOING);
        Audition audition2 = createAudition("오디션2", Audition.AuditionStatus.UNDER_SCREENING);
        Audition audition3 = createAudition("오디션3", Audition.AuditionStatus.FINISHED);
        auditionRepository.saveAll(Arrays.asList(audition1, audition2, audition3));

        // when
        List<Audition.AuditionStatus> statuses = Arrays.asList(
                Audition.AuditionStatus.ONGOING,
                Audition.AuditionStatus.UNDER_SCREENING
        );
        Page<Audition> result = auditionRepository.findByStatusIn(
                statuses, PageRequest.of(0, 10));

        // then
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent())
                .extracting(Audition::getStatus)
                .containsExactlyInAnyOrder(
                        Audition.AuditionStatus.ONGOING,
                        Audition.AuditionStatus.UNDER_SCREENING
                );
    }

    @Test
    void shouldFindByBusinessId() {
        // given
        Audition audition1 = createAudition("오디션1", 1L);
        Audition audition2 = createAudition("오디션2", 1L);
        Audition audition3 = createAudition("오디션3", 2L);
        auditionRepository.saveAll(Arrays.asList(audition1, audition2, audition3));

        // when
        List<Audition.AuditionStatus> statuses = Arrays.asList(
                Audition.AuditionStatus.ONGOING
        );
        Page<Audition> result = auditionRepository.findByBusinessIdAndStatusIn(
                1L, statuses, PageRequest.of(0, 10));

        // then
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent())
                .extracting(Audition::getBusinessId)
                .containsOnly(1L);
    }

    private Audition createAudition(String title, Audition.AuditionStatus status) {
        return Audition.builder()
                .title(title)
                .status(status)
                .category(Audition.AuditionCategory.SINGER)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(30))
                .businessId(1L)
                .build();
    }

    private Audition createAudition(String title, Long businessId) {
        return Audition.builder()
                .title(title)
                .status(Audition.AuditionStatus.ONGOING)
                .category(Audition.AuditionCategory.SINGER)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(30))
                .businessId(businessId)
                .build();
    }
}
