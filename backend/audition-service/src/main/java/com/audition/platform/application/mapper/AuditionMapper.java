package com.audition.platform.application.mapper;

import com.audition.platform.application.dto.AuditionDto;
import com.audition.platform.domain.entity.Audition;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface AuditionMapper {

    AuditionMapper INSTANCE = Mappers.getMapper(AuditionMapper.class);

    @Mapping(target = "businessName", ignore = true) // TODO: User Service에서 조회
    AuditionDto toDto(Audition audition);
}
