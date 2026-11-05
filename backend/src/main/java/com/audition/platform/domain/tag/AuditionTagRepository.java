package com.audition.platform.domain.tag;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AuditionTagRepository extends JpaRepository<AuditionTag, UUID> {

    /**
     * 파생 삭제는 영속성 컨텍스트에 제거를 예약한다.
     * 같은 트랜잭션에서 같은 (audition_id, tag_id) 를 다시 넣기 전에 {@code flush()} 해야 한다.
     * Hibernate 액션 큐는 INSERT 를 DELETE 보다 먼저 실행해 유니크 인덱스가 깨진다.
     */
    void deleteByAuditionId(UUID auditionId);

    List<AuditionTag> findByAuditionIdOrderByIdAsc(UUID auditionId);
}
