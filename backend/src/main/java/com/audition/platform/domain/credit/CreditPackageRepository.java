package com.audition.platform.domain.credit;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CreditPackageRepository extends JpaRepository<CreditPackage, UUID> {

    List<CreditPackage> findByActiveTrueOrderBySortOrderAscPriceAsc();
}
