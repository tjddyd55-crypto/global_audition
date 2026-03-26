package com.audition.platform.infra.s3;

import com.audition.platform.application.storage.R2ImageUploadService;
import com.audition.platform.application.storage.UploadProperties;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.services.s3.S3Client;

/**
 * {@code r2S3Client} 가 등록된 경우에만 이미지 업로드 서비스를 만든다.
 * AWS S3 파일용 클라이언트와 빈 이름으로 분리한다.
 */
@Configuration
public class R2ImageUploadServiceConfig {

    @Bean
    @ConditionalOnBean(name = "r2S3Client")
    public R2ImageUploadService r2ImageUploadService(
            @Qualifier("r2S3Client") S3Client r2S3Client,
            UploadProperties uploadProperties) {
        return new R2ImageUploadService(r2S3Client, uploadProperties);
    }
}
