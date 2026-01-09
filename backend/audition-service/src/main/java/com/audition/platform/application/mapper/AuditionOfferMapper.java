package com.audition.platform.application.mapper;

import com.audition.platform.application.dto.AuditionOfferDto;
import com.audition.platform.domain.entity.AuditionOffer;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface AuditionOfferMapper {

    AuditionOfferMapper INSTANCE = Mappers.getMapper(AuditionOfferMapper.class);

    @Mapping(target = "auditionTitle", ignore = true) // TODO: Audition에서 조회
    @Mapping(target = "businessName", ignore = true) // TODO: User Service에서 조회
    @Mapping(target = "userName", ignore = true) // TODO: User Service에서 조회
    AuditionOfferDto toDto(AuditionOffer offer);
}
