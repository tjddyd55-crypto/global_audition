package com.audition.platform;

import com.audition.platform.application.storage.UploadProperties;
import com.audition.platform.application.i18n.content.TranslationQueueProperties;
import com.audition.platform.application.i18n.translation.GoogleTranslationProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties({
        UploadProperties.class,
        TranslationQueueProperties.class,
        GoogleTranslationProperties.class
})
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
