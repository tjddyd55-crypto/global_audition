package com.audition.platform.application.mapper;

import com.audition.platform.application.dto.AuditionDto;
import com.audition.platform.domain.entity.Audition;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface AuditionMapper {

    AuditionMapper INSTANCE = Mappers.getMapper(AuditionMapper.class);

    // TODO: 내부 API 연동 필요 (작업: 2026_02_architecture_ssot_baseline)
    // - businessName: User Service 내부 API (/internal/users/{userId}/summary) 사용
    // 규칙: DB JOIN 금지, User Service internal API 사용
    @Mapping(target = "businessName", ignore = true)
    AuditionDto toDto(Audition audition);
}
