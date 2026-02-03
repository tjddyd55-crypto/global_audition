package com.audition.platform.presentation.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Audition Service API")
                        .version("1.0.0")
                        .description("온라인 오디션 플랫폼 - 오디션 관리 서비스 API")
                        .contact(new Contact()
                                .name("Audition Platform Team")
                                .email("support@audition-platform.com")));
    }
}
