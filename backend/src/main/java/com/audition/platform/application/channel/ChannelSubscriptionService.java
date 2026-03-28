package com.audition.platform.application.channel;

import com.audition.platform.api.dto.channel.ChannelSubscribeStateDto;
import com.audition.platform.domain.channel.Channel;
import com.audition.platform.domain.channel.ChannelRepository;
import com.audition.platform.domain.channel.ChannelSubscription;
import com.audition.platform.domain.channel.ChannelSubscriptionRepository;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class ChannelSubscriptionService {

    private final ChannelSubscriptionRepository channelSubscriptionRepository;
    private final ChannelRepository channelRepository;
    private final UserRepository userRepository;

    public ChannelSubscriptionService(ChannelSubscriptionRepository channelSubscriptionRepository,
                                      ChannelRepository channelRepository,
                                      UserRepository userRepository) {
        this.channelSubscriptionRepository = channelSubscriptionRepository;
        this.channelRepository = channelRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ChannelSubscribeStateDto subscribe(UUID subscriberId, UUID channelOwnerId) {
        if (subscriberId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        if (subscriberId.equals(channelOwnerId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "자기 자신의 채널은 구독할 수 없습니다.");
        }
        User owner = userRepository.findById(channelOwnerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "채널을 찾을 수 없습니다."));
        if (!owner.isChannelPublic()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "채널을 찾을 수 없습니다.");
        }
        Channel channel = channelRepository.findByOwnerId(channelOwnerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "채널을 찾을 수 없습니다."));
        if (channelSubscriptionRepository.existsBySubscriberIdAndChannelOwnerId(subscriberId, channelOwnerId)) {
            return toState(subscriberId, channelOwnerId, channel);
        }
        ChannelSubscription row = new ChannelSubscription();
        row.setSubscriberId(subscriberId);
        row.setChannelOwnerId(channelOwnerId);
        channelSubscriptionRepository.save(row);
        channel.setSubscriberCount(channel.getSubscriberCount() + 1);
        channelRepository.save(channel);
        return toState(subscriberId, channelOwnerId, channel);
    }

    @Transactional
    public ChannelSubscribeStateDto unsubscribe(UUID subscriberId, UUID channelOwnerId) {
        if (subscriberId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        Channel channel = channelRepository.findByOwnerId(channelOwnerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "채널을 찾을 수 없습니다."));
        int removed = channelSubscriptionRepository.deleteBySubscriberIdAndChannelOwnerId(subscriberId, channelOwnerId);
        if (removed > 0) {
            channel.setSubscriberCount(Math.max(0, channel.getSubscriberCount() - 1));
            channelRepository.save(channel);
        }
        return toState(subscriberId, channelOwnerId, channel);
    }

    private ChannelSubscribeStateDto toState(UUID subscriberId, UUID channelOwnerId, Channel channel) {
        ChannelSubscribeStateDto dto = new ChannelSubscribeStateDto();
        dto.setSubscribed(channelSubscriptionRepository.existsBySubscriberIdAndChannelOwnerId(subscriberId, channelOwnerId));
        dto.setSubscriberCount(channel.getSubscriberCount());
        return dto;
    }
}
