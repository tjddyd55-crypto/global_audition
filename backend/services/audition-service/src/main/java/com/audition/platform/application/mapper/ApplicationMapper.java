package com.audition.platform.application.mapper;

import com.audition.platform.application.dto.ApplicationDto;
import com.audition.platform.domain.entity.Application;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface ApplicationMapper {

    ApplicationMapper INSTANCE = Mappers.getMapper(ApplicationMapper.class);

    // TODO: 내부 API 연동 필요 (작업: 2026_02_architecture_ssot_baseline)
    // - auditionTitle: Audition 엔티티에서 직접 조회 (같은 서비스 내)
    // - userName: User Service 내부 API (/internal/users/{userId}/summary) 사용
    // 규칙: DB JOIN 금지, User Service internal API 사용
    @Mapping(target = "auditionTitle", ignore = true)
    @Mapping(target = "userName", ignore = true)
    @Mapping(target = "assetIds", ignore = true) // 수동으로 채움
    ApplicationDto toDto(Application application);
}
