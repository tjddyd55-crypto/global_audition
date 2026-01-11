package com.audition.platform;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@Slf4j
public class AuditionServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AuditionServiceApplication.class, args);
    }

    @Bean
    public ApplicationRunner portChecker() {
        return args -> {
            String port = System.getenv("PORT");
            log.info("### PORT ENV = {}", port);
            System.out.println("### PORT ENV = " + port);
        };
    }
}
