package com.audition.platform.application.mapper;

import com.audition.platform.application.dto.ApplicationDto;
import com.audition.platform.domain.entity.Application;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface ApplicationMapper {

    ApplicationMapper INSTANCE = Mappers.getMapper(ApplicationMapper.class);

    @Mapping(target = "auditionTitle", ignore = true) // TODO: Audition에서 조회
    @Mapping(target = "userName", ignore = true) // TODO: User Service에서 조회
    ApplicationDto toDto(Application application);
}
