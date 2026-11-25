package com.audition.platform.application.applications;

import com.audition.platform.infra.TestDatabase;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import java.security.SecureRandom;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE, properties = {
    "app.translation.queue.enabled=false", "app.super-admin.bootstrap-enabled=false" })
class EntryNumberingIT {
    private static final String TITLE = "entry-numbering-it";
    @DynamicPropertySource static void props(DynamicPropertyRegistry r) {
        TestDatabase.register(r);
        byte[] key = new byte[64]; new SecureRandom().nextBytes(key);
        r.add("app.jwt.secret", () -> Base64.getUrlEncoder().withoutPadding().encodeToString(key));
    }
    @Autowired JdbcTemplate jdbc;
    @Autowired ApplicationEntryNumbers numbers;
    @Autowired ManageApplicationsQueryService manage;
    @Autowired AgencyApplicationManageService agency;

    @AfterEach void cleanup() {
        SecurityContextHolder.clearContext();
        jdbc.update("DELETE FROM application_scores WHERE application_id IN (SELECT id FROM applications WHERE audition_id IN (SELECT id FROM auditions WHERE title = ?))", TITLE);
        jdbc.update("DELETE FROM applications WHERE audition_id IN (SELECT id FROM auditions WHERE title = ?)", TITLE);
        jdbc.update("DELETE FROM auditions WHERE title = ?", TITLE);
        jdbc.update("DELETE FROM users WHERE email LIKE '%@entry.number.it'");
    }

    @Test void independentScopesKeepHistoryAndNeverRecycleCancelledOrRemovedNumbers() {
        UUID owner = user(), audition = audition(owner);
        UUID a = application(audition, user()), b = application(audition, user());
        UUID c = application(audition, user()), removed = application(audition, user());
        assertEquals(1, numbers.forScope(audition, 0).get(a));
        assertEquals(3, numbers.forScope(audition, 0).get(c));
        jdbc.update("UPDATE applications SET current_round_number = 2 WHERE id = ?", c);
        jdbc.update("UPDATE applications SET current_round_number = 2 WHERE id = ?", a);
        assertEquals(1, numbers.forScope(audition, 2).get(c));
        assertEquals(2, numbers.forScope(audition, 2).get(a));
        jdbc.update("UPDATE applications SET current_round_number = 2 WHERE id = ?", c);
        jdbc.update("UPDATE applications SET status = 'REJECTED', final_status = 'WITHDRAWN', vote_count = 99 WHERE id = ?", b);
        assertEquals(2, numbers.forScope(audition, 0).get(b));
        assertEquals(2, numbers.forScope(audition, 1).get(b));
        jdbc.update("DELETE FROM applications WHERE id = ?", removed);
        UUID added = application(audition, user());
        assertEquals(5, numbers.forScope(audition, 0).get(added));
        assertEquals(5, numbers.forScope(audition, 1).get(added));
        jdbc.update("UPDATE applications SET current_round_number = 5 WHERE id = ?", a);
        assertEquals(1, numbers.forScope(audition, 5).get(a), "No hardcoded final round");
        assertEquals(1, numbers.forScope(audition, 0).get(a));
        assertEquals(1, numbers.forScope(audition, 1).get(a));
        assertEquals(2, numbers.forScope(audition, 2).get(a));
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(owner, null, List.of(new SimpleGrantedAuthority("ROLE_AGENCY"))));
        var allSearch = manage.listManageApplications(audition, null, null, null, null, null, null, null, 3);
        assertEquals(List.of(c.toString()), allSearch.getItems().stream().map(i -> i.getApplicationId()).toList());
        var roundSearch = manage.listManageApplications(audition, null, null, null, null, null, null, 2, 1);
        assertEquals(List.of(c.toString()), roundSearch.getItems().stream().map(i -> i.getApplicationId()).toList());
        assertEquals(1, roundSearch.getItems().get(0).getApplicantNumber());
        var progressedSearch = manage.listManageApplications(audition, null, null, null, null, null, null, 2, 2);
        assertEquals(List.of(a.toString()), progressedSearch.getItems().stream().map(i -> i.getApplicationId()).toList(), "Earlier-round number remains searchable after advancement");
        var history = agency.getApplicationAgencyDetail(c).getNumberHistory();
        assertTrue(history.stream().anyMatch(n -> n.kind().equals("RECEIPT") && n.number() == 3));
        assertTrue(history.stream().anyMatch(n -> n.kind().equals("REVIEW") && n.roundNumber() == 1 && n.number() == 3));
        assertTrue(history.stream().anyMatch(n -> n.kind().equals("REVIEW") && n.roundNumber() == 2 && n.number() == 1));
        UUID another = audition(owner);
        assertTrue(numbers.forScope(another, 0).isEmpty());
        UUID first = application(another, user());
        assertEquals(1, numbers.forScope(another, 0).get(first));
    }

    @Test void concurrentReceiptsHaveUniqueSequentialNumbers() throws Exception {
        UUID audition = audition(user());
        List<UUID> users = new ArrayList<>(); for (int i = 0; i < 8; i++) users.add(user());
        ExecutorService pool = Executors.newFixedThreadPool(4);
        try {
            List<Future<UUID>> futures = new ArrayList<>();
            for (UUID applicant : users) futures.add(pool.submit(() -> application(audition, applicant)));
            for (Future<UUID> future : futures) future.get(30, TimeUnit.SECONDS);
        } finally { pool.shutdownNow(); }
        assertEquals(8, numbers.forScope(audition, 0).size());
        assertEquals(Set.of(1, 2, 3, 4, 5, 6, 7, 8), new HashSet<>(numbers.forScope(audition, 0).values()));
        assertEquals(Set.of(1, 2, 3, 4, 5, 6, 7, 8), new HashSet<>(numbers.forScope(audition, 1).values()));
    }

    private UUID user() {
        UUID id = UUID.randomUUID(); String handle = "n" + id.toString().replace("-", "").substring(0, 12);
        jdbc.update("INSERT INTO users(id,email,password_hash,role,username,display_name,nickname,country_code) VALUES(?,?,'x','AGENCY',?,?,?,'KR')", id, handle + "@entry.number.it", handle, handle, handle);
        return id;
    }
    private UUID audition(UUID owner) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO auditions(id,owner_id,title,description,status,country_code,group_id,process_mode,current_round_number,max_round_number,voting_rounds) VALUES(?, ?, ?, 'test', 'OPEN', 'KR', ?, 'MULTI_ROUND', 1, 6, '{1,2,3,4,5,6}'::int[])", id, owner, TITLE, id);
        return id;
    }
    private UUID application(UUID audition, UUID applicant) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO applications(id,audition_id,applicant_id,status,current_round_number) VALUES(?,?,?,'SUBMITTED',1)", id, audition, applicant);
        return id;
    }
}
