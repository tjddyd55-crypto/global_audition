package com.audition.platform.api;

import com.audition.platform.application.casting.CastingRules;
import com.audition.platform.application.casting.CastingService;
import com.audition.platform.application.casting.CastingViews;
import com.audition.platform.application.casting.TalentSearchService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/** 승인 기획사 전용: 인재 검색, 저장 인재, 캐스팅 제안. 권한은 서비스에서 매번 확인한다. 대량 발송 API 없음. */
@RestController
@RequestMapping("/api/agency")
public class AgencyCastingController {

    private final TalentSearchService talents;
    private final CastingService casting;

    public AgencyCastingController(TalentSearchService talents, CastingService casting) {
        this.talents = talents;
        this.casting = casting;
    }

    @GetMapping("/talents/search")
    public TalentSearchService.Page search(@RequestParam(required = false) String q,
                                           @RequestParam(required = false) String nationality,
                                           @RequestParam(required = false) String residence,
                                           @RequestParam(required = false) List<String> ageBand,
                                           @RequestParam(required = false) String field,
                                           @RequestParam(required = false) String language,
                                           @RequestParam(required = false) Boolean hasCareer,
                                           @RequestParam(required = false) Integer activeWithinDays,
                                           @RequestParam(required = false) Boolean acceptsOffers,
                                           @RequestParam(required = false) String sort,
                                           @RequestParam(required = false) Integer limit,
                                           @RequestParam(required = false) Integer offset) {
        return talents.search(new TalentSearchService.Filter(q, nationality, residence, ageBand, field, language,
                hasCareer, activeWithinDays, acceptsOffers, sort, limit, offset));
    }

    public record SaveBody(String group, String memo) {
    }

    @GetMapping("/talents/saved")
    public List<TalentSearchService.SavedView> saved(@RequestParam(required = false) String group) {
        return talents.saved(group);
    }

    @GetMapping("/talents/saved/groups")
    public List<String> groups() {
        return talents.groups();
    }

    @PostMapping("/talents/saved/{talentId}")
    public TalentSearchService.SavedView save(@PathVariable UUID talentId, @RequestBody(required = false) SaveBody body) {
        return talents.save(talentId, body == null ? null : body.group(), body == null ? null : body.memo());
    }

    @PutMapping("/talents/saved/{talentId}")
    public TalentSearchService.SavedView update(@PathVariable UUID talentId, @RequestBody SaveBody body) {
        return talents.update(talentId, body.group(), body.memo());
    }

    @DeleteMapping("/talents/saved/{talentId}")
    public Map<String, Boolean> unsave(@PathVariable UUID talentId) {
        talents.remove(talentId);
        return Map.of("ok", true);
    }

    @GetMapping("/casting-offers/quota")
    public CastingViews.Quota quota() {
        return casting.quota();
    }

    @PostMapping("/casting-offers/preview")
    public CastingViews.Preview preview(@RequestBody CastingRules.OfferInput body) {
        return casting.preview(body);
    }

    @PostMapping("/casting-offers")
    public CastingViews.OfferView send(@RequestBody CastingRules.OfferInput body) {
        return casting.send(body);
    }

    @GetMapping("/casting-offers")
    public List<CastingViews.OfferView> list(@RequestParam(required = false) String status,
                                             @RequestParam(required = false) UUID talentId) {
        return casting.agencyOffers(status, talentId);
    }

    @GetMapping("/casting-offers/{id}")
    public CastingViews.OfferView detail(@PathVariable UUID id) {
        return casting.agencyOffer(id);
    }

    public record NoteBody(String note) {
    }

    @PostMapping("/casting-offers/{id}/withdraw")
    public CastingViews.OfferView withdraw(@PathVariable UUID id, @RequestBody(required = false) NoteBody body) {
        return casting.withdraw(id, body == null ? null : body.note());
    }
}
