package com.audition.platform.domain.vault;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VaultItemRepository extends JpaRepository<VaultItem, UUID> {

    List<VaultItem> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);

    Optional<VaultItem> findByIdAndOwnerId(UUID id, UUID ownerId);
}
