package com.audition.platform.application.mapper;

import com.audition.platform.application.dto.VideoContentDto;
import com.audition.platform.domain.entity.VideoContent;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface VideoContentMapper {

    VideoContentMapper INSTANCE = Mappers.getMapper(VideoContentMapper.class);

    @Mapping(target = "userName", ignore = true) // TODO: User Service에서 조회
    VideoContentDto toDto(VideoContent videoContent);
}
