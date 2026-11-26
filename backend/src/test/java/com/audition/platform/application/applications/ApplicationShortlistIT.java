package com.audition.platform.application.applications;

import com.audition.platform.infra.TestDatabase;
import com.audition.platform.application.DashboardService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.web.server.ResponseStatusException;
import java.security.SecureRandom;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.NONE, properties={"app.translation.queue.enabled=false","app.super-admin.bootstrap-enabled=false"})
class ApplicationShortlistIT {
    @DynamicPropertySource static void props(DynamicPropertyRegistry r) { TestDatabase.register(r); byte[] k=new byte[64]; new SecureRandom().nextBytes(k); r.add("app.jwt.secret",()->Base64.getUrlEncoder().withoutPadding().encodeToString(k)); }
    @Autowired JdbcTemplate jdbc;
    @Autowired ApplicationShortlistService shortlist;
    @Autowired ApplicationEntryNumbers numbers;
    @Autowired ManageApplicationsQueryService manage;
    @Autowired DashboardService dashboard;
    @AfterEach void cleanup() {
        SecurityContextHolder.clearContext();
        jdbc.update("DELETE FROM application_scores WHERE application_id IN (SELECT id FROM applications WHERE audition_id IN (SELECT id FROM auditions WHERE title='shortlist-it'))");
        jdbc.update("DELETE FROM applications WHERE audition_id IN (SELECT id FROM auditions WHERE title='shortlist-it')");
        jdbc.update("DELETE FROM auditions WHERE title='shortlist-it'");
        jdbc.update("DELETE FROM users WHERE email LIKE '%@shortlist.it'");
    }
    void actor(UUID id,String role) { SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(id,null,List.of(new SimpleGrantedAuthority("ROLE_"+role)))); }
    @Test void scopedSharedStatePersistsWithoutChangingAssessmentOrNumbers() {
        UUID owner=user(), audition=audition(owner), applicant=user(), a=application(audition,applicant), b=application(audition,user()); actor(owner,"AGENCY");
        var before=jdbc.queryForMap("SELECT status,final_status,current_round_number,vote_count FROM applications WHERE id=?",a); var original=numbers.forScope(audition,0);
        shortlist.change(audition,0,List.of(a,b),true); shortlist.change(audition,0,List.of(a),true);
        assertEquals(2,shortlist.list(audition,0).size()); shortlist.memo(audition,0,a,"음색이 좋음");
        assertEquals("음색이 좋음",shortlist.list(audition,0).get(a).memo()); assertEquals(owner,shortlist.list(audition,0).get(a).savedBy());
        assertEquals(before,jdbc.queryForMap("SELECT status,final_status,current_round_number,vote_count FROM applications WHERE id=?",a)); assertEquals(original,numbers.forScope(audition,0));
        assertTrue(shortlist.list(audition,1).isEmpty()); shortlist.change(audition,1,List.of(a),true);
        jdbc.update("UPDATE applications SET current_round_number=5 WHERE id=?",a); assertEquals(1,shortlist.list(audition,1).size()); assertTrue(shortlist.list(audition,5).isEmpty()); shortlist.change(audition,5,List.of(a),true);
        jdbc.update("UPDATE auditions SET vote_started_at=now(), vote_start_at=now()-interval '5 minutes', vote_end_at=now()+interval '5 minutes' WHERE id=?", audition);
        var workload = dashboard.getAgencyDashboard();
        assertEquals(2, workload.getShortlisted());
        assertEquals(2, workload.getSubmitted());
        assertEquals(1, workload.getOpenPublicVotes());
        actor(user(),"ADMIN"); assertEquals(2,shortlist.list(audition,0).size()); shortlist.memo(audition,0,a,"검토 완료");
        SecurityContextHolder.clearContext(); actor(owner,"AGENCY"); assertEquals("검토 완료",shortlist.list(audition,0).get(a).memo());
        var found=manage.listManageApplications(audition,null,null,null,null,null,null,1,1,true,null,"NUMBER",0,50);
        assertEquals(1,found.getItems().size()); assertEquals(1,found.getItems().get(0).getApplicantNumber()); assertTrue(found.getItems().get(0).isShortlisted());
        shortlist.change(audition,0,List.of(a,b),false); shortlist.change(audition,0,List.of(a),false); assertTrue(shortlist.list(audition,0).isEmpty()); assertEquals(1,shortlist.list(audition,1).size()); assertEquals(original,numbers.forScope(audition,0));
        actor(user(),"AGENCY"); assertThrows(ResponseStatusException.class,()->shortlist.list(audition,0)); assertThrows(ResponseStatusException.class,()->shortlist.change(audition,0,List.of(a),true));
        actor(applicant,"APPLICANT"); assertThrows(ResponseStatusException.class,()->shortlist.list(audition,0)); assertThrows(ResponseStatusException.class,()->shortlist.memo(audition,1,a,"leak"));
    }
    @Test void serverPagingSearchAndAtomicBatchValidation() {
        UUID owner=user(), audition=audition(owner); actor(owner,"AGENCY"); List<UUID> ids=new ArrayList<>(); for(int i=0;i<55;i++) ids.add(application(audition,user()));
        shortlist.change(audition,0,ids.subList(0,12),true);
        var first=manage.listManageApplications(audition,null,null,null,null,null,null,null,null,false,null,"NUMBER",0,20);
        var second=manage.listManageApplications(audition,null,null,null,null,null,null,null,null,false,null,"NUMBER",1,20);
        assertEquals(55,first.getTotalElements()); assertEquals(3,first.getTotalPages()); assertEquals(20,first.getItems().size()); assertEquals(1,first.getItems().get(0).getApplicantNumber()); assertEquals(21,second.getItems().get(0).getApplicantNumber()); assertEquals(12,first.getShortlistCount());
        var saved=manage.listManageApplications(audition,null,null,null,null,null,null,null,null,true,null,"NUMBER",0,50); assertEquals(12,saved.getTotalElements());
        UUID other=application(audition(user()),user()); assertThrows(ResponseStatusException.class,()->shortlist.change(audition,0,List.of(ids.get(20),other),true)); assertEquals(12,shortlist.list(audition,0).size());
        assertThrows(ResponseStatusException.class,()->shortlist.change(audition,2,List.of(ids.get(0)),true)); assertThrows(ResponseStatusException.class,()->shortlist.memo(audition,0,ids.get(0),"x".repeat(1001)));
        jdbc.update("UPDATE applications SET applicant_name='검토 이름' WHERE id=?",ids.get(0)); assertEquals(1,manage.listManageApplications(audition,null,null,null,null,null,null,null,null,true,"검토 이름","NAME",0,50).getTotalElements());
        assertThrows(ResponseStatusException.class,()->manage.listManageApplications(audition,null,null,null,null,null,null,null,null,false,null,null,0,1000));
    }
    @Test void concurrentDuplicateSavesAreIdempotent() throws Exception {
        UUID owner=user(), audition=audition(owner), a=application(audition,user()); ExecutorService pool=Executors.newFixedThreadPool(4);
        try { List<Future<?>> tasks=new ArrayList<>(); for(int i=0;i<8;i++) tasks.add(pool.submit(()->{ actor(owner,"AGENCY"); try { shortlist.change(audition,0,List.of(a),true); } finally { SecurityContextHolder.clearContext(); } })); for(var task:tasks) task.get(30,TimeUnit.SECONDS); } finally { pool.shutdownNow(); }
        actor(owner,"AGENCY"); assertEquals(1,shortlist.list(audition,0).size());
    }
    UUID user() { UUID id=UUID.randomUUID(); String h="s"+id.toString().replace("-","").substring(0,12); jdbc.update("INSERT INTO users(id,email,password_hash,role,username,display_name,nickname,country_code) VALUES(?,?,'x','AGENCY',?,?,?,'KR')",id,h+"@shortlist.it",h,h,h); return id; }
    UUID audition(UUID owner) { UUID id=UUID.randomUUID(); jdbc.update("INSERT INTO auditions(id,owner_id,title,description,status,country_code,group_id,process_mode,current_round_number,max_round_number,voting_rounds) VALUES(?,?,'shortlist-it','test','OPEN','KR',?,'MULTI_ROUND',1,6,'{1,2,3,4,5,6}'::int[])",id,owner,id); return id; }
    UUID application(UUID audition,UUID applicant) { UUID id=UUID.randomUUID(); jdbc.update("INSERT INTO applications(id,audition_id,applicant_id,status,current_round_number) VALUES(?,?,?,'SUBMITTED',1)",id,audition,applicant); return id; }
}
