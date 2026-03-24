package com.audition.platform.infra.s3;

import com.audition.platform.application.storage.S3ImageUploadService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.services.s3.S3Client;

/**
 * 업로드 서비스는 S3Client가 실제로 등록된 경우에만 생성한다.
 * 조건을 @Service 클래스에 직접 두지 않고 설정 계층으로 올려 빈 등록 순서 이슈를 피한다.
 */
@Configuration
public class S3ImageUploadServiceConfig {

    @Bean
    @ConditionalOnBean(S3Client.class)
    public S3ImageUploadService s3ImageUploadService(S3Client s3Client) {
        return new S3ImageUploadService(s3Client);
    }
}
