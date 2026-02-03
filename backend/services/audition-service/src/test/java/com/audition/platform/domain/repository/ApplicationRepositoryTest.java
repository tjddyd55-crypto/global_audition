package com.audition.platform.domain.repository;

import com.audition.platform.domain.entity.Application;
import com.audition.platform.domain.entity.Audition;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Import(com.audition.platform.config.JpaAuditingConfig.class)
@ActiveProfiles("test")
class ApplicationRepositoryTest {

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private AuditionRepository auditionRepository;

    @Test
    void shouldFindByUserIdAndAuditionId() {
        // given
        Audition audition = Audition.builder()
                .title("테스트 오디션")
                .status(Audition.AuditionStatus.ONGOING)
                .category(Audition.AuditionCategory.SINGER)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(30))
                .businessId(1L)
                .build();
        Audition savedAudition = auditionRepository.save(audition);

        Application application = Application.builder()
                .audition(savedAudition)
                .userId(1L)
                .status(Application.ApplicationStatus.APPLICATION_COMPLETED)
                .build();
        applicationRepository.save(application);

        // when
        Optional<Application> found = applicationRepository.findByUserIdAndAuditionId(1L, savedAudition.getId());

        // then
        assertThat(found).isPresent();
        assertThat(found.get().getUserId()).isEqualTo(1L);
        assertThat(found.get().getAudition().getId()).isEqualTo(savedAudition.getId());
    }
}
