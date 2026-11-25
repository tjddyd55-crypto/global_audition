package com.audition.platform.application.points;

import com.audition.platform.api.dto.CreateApplicationRequest;
import com.audition.platform.application.applications.ApplicationSubmitService;
import com.audition.platform.application.credit.CreditService;
import com.audition.platform.application.points.PointPolicies.Activity;
import com.audition.platform.application.points.PointPolicies.Rule;
import com.audition.platform.application.points.PointPolicies.Settings;
import com.audition.platform.domain.user.UserRepository;
import com.audition.platform.infra.TestDatabase;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.NONE,properties={
        "app.translation.queue.enabled=false","app.super-admin.bootstrap-enabled=false"})
class ActivityPointsIT {
    @DynamicPropertySource
    static void props(DynamicPropertyRegistry r) {
        TestDatabase.register(r);
        byte[] key = new byte[64]; new SecureRandom().nextBytes(key);
        r.add("app.jwt.secret",()->Base64.getUrlEncoder().withoutPadding().encodeToString(key));
    }

    @Autowired JdbcTemplate jdbc;
    @Autowired PointPolicies policies;
    @Autowired PointsService points;
    @Autowired PointRewards rewards;
    @Autowired PointWallet wallets;
    @Autowired CreditService credits;
    @Autowired UserRepository users;
    @Autowired ApplicationSubmitService applications;
    @Autowired com.audition.platform.application.channel.ChannelVideoPublicService channel;
    @Autowired TransactionTemplate transaction;

    private UUID admin;
    private Settings original;
    private final List<Rule> changedRules = new ArrayList<>();

    @BeforeEach
    void setup() {
        admin = user("KR","SUPER_ADMIN");
        actor(admin,"SUPER_ADMIN");
        original=policies.settings();
    }

    @AfterEach
    void cleanup() {
        actor(admin,"SUPER_ADMIN");
        for (Rule old : changedRules) {
            Rule now=policies.rules().stream().filter(r->r.id().equals(old.id())).findFirst().orElseThrow();
            policies.updateRule(new Rule(old.id(),old.activity(),old.countryCode(),old.name(),old.enabled(),old.goal(),
                    old.award(),old.repeatable(),old.dailyLimit(),old.monthlyLimit(),old.dailyEventLimit(),
                    old.monthlyPointLimit(),old.consecutive(),old.profileFields(),old.minAccountDays(),
                    old.startsAt(),old.endsAt(),now.revision()));
        }
        policies.updateSettings(original);
        jdbc.update("DELETE FROM point_policy_history WHERE actor_id=?",admin);
        jdbc.update("DELETE FROM application_videos WHERE application_id IN (SELECT p.id FROM applications p JOIN auditions a ON a.id=p.audition_id WHERE a.title='points-it')");
        jdbc.update("DELETE FROM applications WHERE audition_id IN (SELECT id FROM auditions WHERE title='points-it')");
        jdbc.update("DELETE FROM auditions WHERE title='points-it'");
        jdbc.update("DELETE FROM users WHERE email LIKE '%@activity.points.it'");
        jdbc.update("DELETE FROM point_policies WHERE country_code='MN' AND activity='DAILY_CHECK_IN'");
        SecurityContextHolder.clearContext();
    }

    @Test
    void concurrentAttendanceAwardConfigurationDoesNotRepricePastEntries() throws Exception {
        UUID member=user("MN","APPLICANT");
        assertFalse(policies.settings().canEarn());
        actor(member,"APPLICANT");
        assertEquals(403,assertThrows(ResponseStatusException.class,
                ()->policies.updateSettings(new Settings(true,true,true,true,100))).getStatusCode().value());
        actor(admin,"SUPER_ADMIN");
        configure(Activity.DAILY_CHECK_IN,1,10,true);
        configure(Activity.MONTHLY_CHECK_IN,1,50,true);
        policies.updateSettings(new Settings(true,true,true,true,100));
        policies.updateRule(new Rule(null,Activity.DAILY_CHECK_IN,"MN","Mongolia daily",true,1,12,
                true,1,31,1,0,false,List.of(),0,null,null,0));
        ExecutorService pool=Executors.newFixedThreadPool(4);
        try {
            List<Future<?>> requests=new ArrayList<>();
            for (int i=0;i<8;i++) requests.add(pool.submit(()->rewards.checkIn(member)));
            for (var request:requests) request.get(20,TimeUnit.SECONDS);
        } finally { pool.shutdownNow(); }
        assertEquals(62,wallets.read(member).balance());
        assertEquals(List.of(PointWallet.today()),rewards.attendance(member));
        assertEquals(2,wallets.entries(member,0).size());
        jdbc.update("UPDATE users SET country_code='KR' WHERE id=?",member);
        assertEquals("MN",wallets.read(member).countryCode());
        Rule rule=policies.rules().stream().filter(r->r.activity()==Activity.DAILY_CHECK_IN && r.countryCode().equals("MN")).findFirst().orElseThrow();
        assertThrows(ResponseStatusException.class,()->policies.updateRule(copyRule(rule,2,20,true,1)));
        policies.updateRule(copyRule(rule,1,20,true,1));
        rewards.checkIn(member);
        assertEquals(62,wallets.read(member).balance());
        policies.updateSettings(new Settings(true,false,true,true,100));
        assertThrows(ResponseStatusException.class,()->rewards.checkIn(member));
        assertEquals(62,wallets.read(member).balance());
        assertTrue(points.quote(member).pointAllowed());
    }

    @Test
    void successfulPointApplicationKeepsCreditAndRollsBackFailedPayment() {
        UUID member=user("KR","APPLICANT"), owner=user("KR","AGENCY");
        UUID audition=audition(owner), tooExpensive=audition(owner);
        var grantId=UUID.randomUUID();
        policies.updateSettings(new Settings(true,false,true,true,300));
        points.adjust(new PointsService.Adjustment(member,grantId,300,"test seed",null));
        points.adjust(new PointsService.Adjustment(member,grantId,300,"retry same adjustment",null));
        assertEquals(300,wallets.read(member).balance());
        long c=credits.getBalance(member);
        actor(member,"APPLICANT");
        assertThrows(ResponseStatusException.class,()->applications.submitApplication(request(audition,301)));
        assertFalse(existsApplication(audition,member));
        assertEquals(300,wallets.read(member).balance());
        var actual=applications.submitApplication(request(audition,300));
        assertEquals("SUBMITTED",actual.getStatus());
        assertEquals(c,credits.getBalance(member));
        assertEquals(0,wallets.read(member).balance());
        assertThrows(ResponseStatusException.class,()->applications.submitApplication(request(audition,300)));
        assertThrows(ResponseStatusException.class,()->applications.submitApplication(request(tooExpensive,300)));
        assertFalse(existsApplication(tooExpensive,member));
        assertEquals(1,jdbc.queryForObject("SELECT COUNT(*) FROM point_entries WHERE user_id=? AND kind='AUDITION_APPLY'",Integer.class,member));
        assertEquals(1,jdbc.queryForObject("SELECT entry_number FROM application_entry_numbers WHERE application_id=? AND round_number=0",Integer.class,actual.getId()));
        assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM revenue_attributions WHERE application_id=?",Integer.class,actual.getId()));
        actor(admin,"SUPER_ADMIN");
        assertEquals(1,((Number)((Map<?,?>)points.stats().get("summary")).get("point_applications")).longValue());
    }

    @Test
    void deduplicatesVerifiedEventsAndRecordsReversalsAndReferrals() {
        UUID member=user("KR","APPLICANT"), invited=user("KR","APPLICANT");
        for (Activity type : List.of(Activity.VIDEO,Activity.COMMENT,Activity.PUBLIC_VOTE,Activity.REFERRAL,Activity.PROFILE))
            configure(type,1,10,type!=Activity.PROFILE);
        policies.updateSettings(new Settings(true,true,false,false,100));
        rewards.recordVideo(member,"sameYoutube");
        rewards.recordVideo(member,"sameYoutube");
        rewards.recordComment(member,invited,UUID.randomUUID(),"This is a good video.");
        rewards.recordComment(member,invited,UUID.randomUUID(),"THIS   IS A GOOD VIDEO!!");
        rewards.recordComment(member,invited,UUID.randomUUID(),"https://example.com");
        rewards.recordComment(member,member,UUID.randomUUID(),"My own video is great.");
        UUID audition=UUID.randomUUID();
        rewards.recordVote(member,audition,1);
        rewards.recordVote(member,audition,1);
        jdbc.update("UPDATE users SET intro_text='Profile complete' WHERE id=?",member);
        rewards.recordProfile(users.findById(member).orElseThrow());
        rewards.recordProfile(users.findById(member).orElseThrow());
        UUID code=points.inviteCode(member);
        transaction.executeWithoutResult(x->{
            points.registerReferral(member,code);
            points.registerReferral(invited,code);
            points.registerReferral(invited,code);
        });
        points.confirmReferral(invited);
        assertEquals(40,wallets.read(member).balance());
        jdbc.update("UPDATE users SET created_at=NOW()-INTERVAL '10 days' WHERE id=?",invited);
        points.confirmReferral(invited);
        points.confirmReferral(invited);
        assertEquals(50,wallets.read(member).balance());
        var earn=wallets.entries(member,0).stream().filter(e->"COMMENT".equals(e.activity())).findFirst().orElseThrow();
        points.adjust(new PointsService.Adjustment(member,UUID.randomUUID(),0,"invalid comment",earn.id()));
        points.adjust(new PointsService.Adjustment(member,UUID.randomUUID(),0,"retry",earn.id()));
        assertEquals(40,wallets.read(member).balance());
        assertEquals(1,wallets.entries(member,0).stream().filter(e->"REVOKE".equals(e.kind())).count());
    }

    @Test
    void twoActiveDistinctLikesAreRequiredAndSelfLikesNeverEarn() {
        UUID owner=user("KR","APPLICANT"), first=user("KR","APPLICANT"), second=user("KR","APPLICANT");
        UUID channelId=UUID.randomUUID(), video=UUID.randomUUID();
        jdbc.update("UPDATE users SET is_channel_public=true WHERE id=?",owner);
        jdbc.update("INSERT INTO channels(id,owner_id,name) VALUES(?,?,'points test')",channelId,owner);
        jdbc.update("""
                INSERT INTO channel_videos(id,owner_id,channel_id,title,video_url,visibility)
                VALUES(?,?,?,'Test','https://www.youtube.com/watch?v=jfKfPfyJRdk','PUBLIC')
                """,video,owner,channelId);
        configure(Activity.LIKE_RECEIVED,2,50,false);
        configure(Activity.LIKE_GIVEN,1,7,true);
        policies.updateSettings(new Settings(true,true,false,false,100));
        channel.toggleLike(video,owner);
        assertEquals(0,wallets.read(owner).balance());
        channel.toggleLike(video,first);
        channel.toggleLike(video,first); // Deactivate the first like before the second arrives.
        channel.toggleLike(video,second);
        assertEquals(0,wallets.read(owner).balance());
        channel.toggleLike(video,first);
        // A restored like remains the same event; reaching the goal on a new valid event is required.
        UUID third=user("KR","APPLICANT");
        channel.toggleLike(video,first);
        channel.toggleLike(video,third);
        assertEquals(50,wallets.read(owner).balance());
        assertEquals(7,wallets.read(first).balance());
        assertEquals(7,wallets.read(second).balance());
        assertEquals(7,wallets.read(third).balance());
    }

    private void configure(Activity activity, int goal, long award, boolean repeatable) {
        Rule current=policies.rules().stream().filter(r->r.activity()==activity && r.countryCode().isEmpty()).findFirst().orElseThrow();
        changedRules.add(current);
        policies.updateRule(copyRule(current,goal,award,repeatable,current.dailyLimit()));
    }

    private Rule copyRule(Rule r,int goal,long award,boolean repeat,int dailyLimit) {
        return new Rule(r.id(),r.activity(),r.countryCode(),r.name(),true,goal,award,repeat,dailyLimit,r.monthlyLimit(),
                r.dailyEventLimit(),r.monthlyPointLimit(),r.consecutive(),r.profileFields(),r.minAccountDays(),null,null,r.revision());
    }

    private UUID user(String country,String role) {
        UUID id=UUID.randomUUID();
        String username="p"+id.toString().replace("-","").substring(0,12);
        jdbc.update("""
                INSERT INTO users(id,email,password_hash,role,username,nickname,country_code,birth_date)
                VALUES(?,?,'x',?,?,?,?,'2000-01-01')
                """,id,username+"@activity.points.it",role,username,username,country);
        return id;
    }

    private UUID audition(UUID owner) {
        UUID id=UUID.randomUUID();
        jdbc.update("""
                INSERT INTO auditions(id,owner_id,title,description,status,country_code,group_id,process_mode)
                VALUES(?,?,'points-it','test','OPEN','KR',?,'SINGLE')
                """,id,owner,id);
        return id;
    }

    private boolean existsApplication(UUID audition, UUID user) {
        return Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM applications WHERE audition_id=? AND applicant_id=?)",Boolean.class,audition,user));
    }

    private static CreateApplicationRequest request(UUID audition,long cost) {
        var req=new CreateApplicationRequest();
        req.setAuditionId(audition);
        req.setName("Test applicant");
        req.setBirthDate("2000-01-01");
        req.setVideoUrl("https://www.youtube.com/watch?v=jfKfPfyJRdk");
        req.setPaymentMethod("POINT");
        req.setExpectedPointCost(cost);
        return req;
    }

    private static void actor(UUID id,String role) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(id,null,
                List.of(new SimpleGrantedAuthority("ROLE_"+role))));
    }
}
