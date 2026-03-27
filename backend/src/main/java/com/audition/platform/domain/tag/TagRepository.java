package com.audition.platform.domain.tag;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TagRepository extends JpaRepository<Tag, UUID> {

    List<Tag> findAllByActiveTrueOrderByTypeAscNameAsc();

    List<Tag> findAllByOrderByTypeAscNameAsc();

    Optional<Tag> findFirstByNameIgnoreCaseAndActiveTrue(String name);

    Optional<Tag> findFirstByNameIgnoreCase(String name);
}
