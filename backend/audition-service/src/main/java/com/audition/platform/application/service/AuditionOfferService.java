package com.audition.platform.application.service;

import com.audition.platform.application.dto.AuditionOfferDto;
import com.audition.platform.application.dto.CreateOfferRequest;
import com.audition.platform.application.dto.RespondOfferRequest;
import com.audition.platform.application.mapper.AuditionOfferMapper;
import com.audition.platform.domain.entity.AuditionOffer;
import com.audition.platform.domain.repository.AuditionOfferRepository;
import com.audition.platform.domain.repository.AuditionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class AuditionOfferService {

    private final AuditionOfferRepository offerRepository;
    private final AuditionRepository auditionRepository;
    private final AuditionOfferMapper offerMapper;

    @Transactional(readOnly = true)
    public Page<AuditionOfferDto> getUserOffers(Long userId, Pageable pageable) {
        Page<AuditionOffer> offers = offerRepository.findByUserId(userId, pageable);
        return offers.map(offerMapper::toDto);
    }

    @Transactional(readOnly = true)
    public Page<AuditionOfferDto> getBusinessOffers(Long businessId, Pageable pageable) {
        Page<AuditionOffer> offers = offerRepository.findByBusinessId(businessId, pageable);
        return offers.map(offerMapper::toDto);
    }

    @Transactional(readOnly = true)
    public AuditionOfferDto getOffer(Long id) {
        AuditionOffer offer = offerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Offer not found: " + id));
        return offerMapper.toDto(offer);
    }

    public AuditionOfferDto createOffer(Long businessId, CreateOfferRequest request) {
        // 오디션 존재 확인
        auditionRepository.findById(request.getAuditionId())
                .orElseThrow(() -> new RuntimeException("Audition not found: " + request.getAuditionId()));

        // 이미 같은 비디오에 제안했는지 확인
        offerRepository.findByBusinessIdAndVideoContentId(businessId, request.getVideoContentId())
                .ifPresent(offer -> {
                    throw new RuntimeException("Already offered for this video");
                });

        // TODO: videoContentId로 userId 조회 (Media Service 또는 User Service에서)
        Long userId = 1L; // 임시

        AuditionOffer offer = AuditionOffer.builder()
                .auditionId(request.getAuditionId())
                .businessId(businessId)
                .userId(userId)
                .videoContentId(request.getVideoContentId())
                .message(request.getMessage())
                .status(AuditionOffer.OfferStatus.PENDING)
                .build();

        AuditionOffer saved = offerRepository.save(offer);
        return offerMapper.toDto(saved);
    }

    public AuditionOfferDto respondToOffer(Long id, Long userId, RespondOfferRequest request) {
        AuditionOffer offer = offerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Offer not found: " + id));

        if (!offer.getUserId().equals(userId)) {
            throw new RuntimeException("Not authorized to respond to this offer");
        }

        if (offer.getStatus() != AuditionOffer.OfferStatus.PENDING) {
            throw new RuntimeException("Offer is not pending");
        }

        if ("ACCEPT".equalsIgnoreCase(request.getResponse())) {
            offer.setStatus(AuditionOffer.OfferStatus.ACCEPTED);
        } else if ("REJECT".equalsIgnoreCase(request.getResponse())) {
            offer.setStatus(AuditionOffer.OfferStatus.REJECTED);
        } else {
            throw new RuntimeException("Invalid response: " + request.getResponse());
        }

        offer.setRespondedAt(LocalDateTime.now());
        AuditionOffer updated = offerRepository.save(offer);
        return offerMapper.toDto(updated);
    }

    public AuditionOfferDto markAsRead(Long id, Long userId) {
        AuditionOffer offer = offerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Offer not found: " + id));

        if (!offer.getUserId().equals(userId)) {
            throw new RuntimeException("Not authorized");
        }

        offer.setReadAt(LocalDateTime.now());
        AuditionOffer updated = offerRepository.save(offer);
        return offerMapper.toDto(updated);
    }

    @Transactional(readOnly = true)
    public Long countPendingOffers(Long userId) {
        return offerRepository.countPendingByUserId(userId);
    }
}
