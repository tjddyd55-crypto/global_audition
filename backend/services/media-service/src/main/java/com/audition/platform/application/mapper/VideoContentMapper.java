package com.audition.platform.application.mapper;

import com.audition.platform.application.dto.VideoContentDto;
import com.audition.platform.domain.entity.VideoContent;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface VideoContentMapper {

    VideoContentMapper INSTANCE = Mappers.getMapper(VideoContentMapper.class);

    // TODO: 내부 API 연동 필요 (작업: 2026_02_architecture_ssot_baseline)
    // - userName: User Service 내부 API (/internal/users/{userId}/summary) 사용
    // 규칙: DB JOIN 금지, User Service internal API 사용
    @Mapping(target = "userName", ignore = true)
    VideoContentDto toDto(VideoContent videoContent);
}
