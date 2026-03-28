package com.audition.platform.domain.channel;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ChannelSubscriptionRepository extends JpaRepository<ChannelSubscription, UUID> {

    boolean existsBySubscriberIdAndChannelOwnerId(UUID subscriberId, UUID channelOwnerId);

    Optional<ChannelSubscription> findBySubscriberIdAndChannelOwnerId(UUID subscriberId, UUID channelOwnerId);

    int deleteBySubscriberIdAndChannelOwnerId(UUID subscriberId, UUID channelOwnerId);
}
