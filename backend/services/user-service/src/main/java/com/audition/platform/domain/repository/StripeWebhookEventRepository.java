package com.audition.platform.domain.repository;

import com.audition.platform.domain.entity.StripeWebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StripeWebhookEventRepository extends JpaRepository<StripeWebhookEvent, Long> {
    Optional<StripeWebhookEvent> findByEventId(String eventId);
}

