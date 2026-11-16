package com.audition.platform.infra;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.util.ArrayList;
import java.util.List;

/**
 * 투표/랭킹 관련 필수 테이블·제약 존재 여부를 기동 시 점검하고 로그로 보고합니다.
 */
@Component
@Order(10_000)
@ConditionalOnProperty(prefix = "audition", name = "voting-db-verify", havingValue = "true", matchIfMissing = true)
public class VotingDatabaseSchemaVerifier implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(VotingDatabaseSchemaVerifier.class);

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    public VotingDatabaseSchemaVerifier(JdbcTemplate jdbcTemplate, DataSource dataSource) {
        this.jdbcTemplate = jdbcTemplate;
        this.dataSource = dataSource;
    }

    @Override
    public void run(ApplicationArguments args) {
        try (Connection c = dataSource.getConnection()) {
            DatabaseMetaData md = c.getMetaData();
            String url = md.getURL() != null ? md.getURL() : "";
            if (!url.contains("postgresql")) {
                log.info("[Voting DB] 스키마 검증 생략 (PostgreSQL URL 아님): {}", url);
                return;
            }
        } catch (Exception e) {
            log.warn("[Voting DB] DataSource 메타 확인 실패 — 스키마 검증 생략: {}", e.getMessage());
            return;
        }

        List<String> failures = new ArrayList<>();

        if (!tableExists("votes")) {
            failures.add("테이블 votes 없음");
        }
        if (!tableExists("application_scores")) {
            failures.add("테이블 application_scores 없음");
        }
        if (!tableExists("application_videos")) {
            failures.add("테이블 application_videos 없음");
        }
        if (!columnExists("applications", "vote_count")) {
            failures.add("컬럼 applications.vote_count 없음");
        }
        if (!uniqueVotesPerRoundExists()) {
            failures.add("투표 유일성: uq_votes_user_audition_round 인덱스 없음(V68)");
        }

        if (failures.isEmpty()) {
            log.info("DB CHECK RESULT OK");
        } else {
            log.error("DB CHECK RESULT FAILED: {}", String.join("; ", failures));
        }
    }

    private boolean tableExists(String table) {
        Integer n = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = ?
                """,
                Integer.class,
                table);
        return n != null && n > 0;
    }

    private boolean columnExists(String table, String column) {
        Integer n = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = ? AND column_name = ?
                """,
                Integer.class,
                table,
                column);
        return n != null && n > 0;
    }

    /** V68: 사용자는 (오디션, 회차)마다 1표 — partial unique 인덱스. */
    private boolean uniqueVotesPerRoundExists() {
        Integer idx = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM pg_indexes
                WHERE schemaname = 'public' AND indexname = 'uq_votes_user_audition_round'
                """,
                Integer.class);
        return idx != null && idx > 0;
    }
}
