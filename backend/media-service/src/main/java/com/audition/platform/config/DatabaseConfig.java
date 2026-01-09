package com.audition.platform.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

import java.net.URI;

@Configuration
@Profile("production")
public class DatabaseConfig {

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Bean
    @Primary
    @ConfigurationProperties("spring.datasource")
    public DataSourceProperties dataSourceProperties() {
        DataSourceProperties properties = new DataSourceProperties();
        
        // Railway DATABASE_URL 형식: postgresql://user:password@host:port/database
        if (databaseUrl != null && !databaseUrl.isEmpty() && databaseUrl.startsWith("postgresql://")) {
            try {
                URI uri = new URI(databaseUrl);
                String userInfo = uri.getUserInfo();
                String[] userPass = userInfo != null ? userInfo.split(":") : new String[2];
                
                String jdbcUrl = "jdbc:postgresql://" + uri.getHost() + 
                               (uri.getPort() > 0 ? ":" + uri.getPort() : "") + 
                               uri.getPath();
                
                properties.setUrl(jdbcUrl);
                if (userPass.length > 0 && !userPass[0].isEmpty()) {
                    properties.setUsername(userPass[0]);
                }
                if (userPass.length > 1 && !userPass[1].isEmpty()) {
                    properties.setPassword(userPass[1]);
                }
            } catch (Exception e) {
                // 변환 실패 시 기본값 사용
            }
        }
        
        return properties;
    }
}
