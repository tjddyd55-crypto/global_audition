package com.audition.platform.infra.s3;

import com.audition.platform.application.storage.R2ImageUploadService;
import com.audition.platform.application.storage.UploadProperties;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.services.s3.S3Client;

/**
 * 이미지 업로드 서비스는 항상 등록하고, 내부 준비 상태는 {@code r2S3Client} 존재 여부로 판단한다.
 * 이렇게 하면 조건부 빈 등록 순서에 따라 서비스가 누락되는 문제를 피할 수 있다.
 */
@Configuration
public class R2ImageUploadServiceConfig {

    @Bean
    public R2ImageUploadService r2ImageUploadService(
            @Qualifier("r2S3Client") ObjectProvider<S3Client> r2S3ClientProvider,
            UploadProperties uploadProperties) {
        return new R2ImageUploadService(r2S3ClientProvider.getIfAvailable(), uploadProperties);
    }
}
