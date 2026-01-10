package com.audition.platform.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
@Profile("never")  // 비활성화: 개별 환경 변수 사용 시 필요 없음
public class DatabaseConfig {

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Bean
    @Primary
    public DataSource dataSource() {
        System.out.println("=== DatabaseConfig: Creating DataSource ===");
        System.out.println("DATABASE_URL: " + (databaseUrl != null && !databaseUrl.isEmpty() ? "SET" : "EMPTY"));
        
        // Railway DATABASE_URL 형식: postgresql://user:password@host:port/database
        if (databaseUrl != null && !databaseUrl.isEmpty() && databaseUrl.startsWith("postgresql://")) {
            try {
                URI uri = new URI(databaseUrl);
                String userInfo = uri.getUserInfo();
                String[] userPass = userInfo != null ? userInfo.split(":") : new String[2];
                
                String host = uri.getHost();
                int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                String database = uri.getPath().replaceFirst("/", "");
                
                String jdbcUrl = String.format("jdbc:postgresql://%s:%d/%s", host, port, database);
                String username = userPass.length > 0 ? userPass[0] : "";
                String password = userPass.length > 1 ? userPass[1] : "";
                
                System.out.println("Parsing DATABASE_URL: " + databaseUrl);
                System.out.println("JDBC URL: " + jdbcUrl);
                System.out.println("Username: " + username);
                System.out.println("Host: " + host);
                System.out.println("Port: " + port);
                System.out.println("Database: " + database);
                
                return DataSourceBuilder.create()
                        .url(jdbcUrl)
                        .username(username)
                        .password(password)
                        .driverClassName("org.postgresql.Driver")
                        .build();
            } catch (Exception e) {
                System.err.println("Failed to parse DATABASE_URL: " + databaseUrl);
                e.printStackTrace();
                throw new RuntimeException("Failed to parse DATABASE_URL: " + databaseUrl, e);
            }
        }
        
        System.err.println("DATABASE_URL is empty or not in postgresql:// format: " + databaseUrl);
        System.err.println("Using default DataSource");
        
        // DATABASE_URL이 없으면 기본값 사용
        return DataSourceBuilder.create()
                .url("jdbc:postgresql://localhost:5432/audition_db")
                .username("audition_user")
                .password("audition_pass")
                .driverClassName("org.postgresql.Driver")
                .build();
    }
}
