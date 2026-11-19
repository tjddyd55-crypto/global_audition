package com.audition.platform.api;

import com.audition.platform.application.casting.CastingService;
import com.audition.platform.application.casting.CastingViews;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/** 지원자: 받은 캐스팅 제안. 수락은 관심 표시일 뿐 계약·지원·결제·크레딧과 무관하다. */
@RestController
@RequestMapping("/api/me")
public class MeCastingController {

    private final CastingService casting;

    public MeCastingController(CastingService casting) {
        this.casting = casting;
    }

    @GetMapping("/casting-offers")
    public List<CastingViews.OfferView> list() {
        return casting.myOffers();
    }

    @GetMapping("/casting-offers/{id}")
    public CastingViews.OfferView detail(@PathVariable UUID id) {
        return casting.myOffer(id);
    }

    public record AcceptBody(Boolean shareContact, String note) {
    }

    @PostMapping("/casting-offers/{id}/accept")
    public CastingViews.OfferView accept(@PathVariable UUID id, @RequestBody(required = false) AcceptBody body) {
        return casting.accept(id, body != null && Boolean.TRUE.equals(body.shareContact()), body == null ? null : body.note());
    }

    public record DeclineBody(String reason, String note) {
    }

    @PostMapping("/casting-offers/{id}/decline")
    public CastingViews.OfferView decline(@PathVariable UUID id, @RequestBody DeclineBody body) {
        return casting.decline(id, body.reason(), body.note());
    }

    public record ReportBody(String reason, String detail, Boolean blockAgency) {
    }

    @PostMapping("/casting-offers/{id}/report")
    public Map<String, String> report(@PathVariable UUID id, @RequestBody ReportBody body) {
        UUID reportId = casting.report(id, body.reason(), body.detail(), Boolean.TRUE.equals(body.blockAgency()));
        return Map.of("reportId", reportId.toString());
    }

    @PostMapping("/casting-offers/{id}/block")
    public Map<String, Boolean> block(@PathVariable UUID id) {
        casting.blockAgencyOfOffer(id);
        return Map.of("ok", true);
    }

    @GetMapping("/casting-blocks")
    public List<CastingViews.Party> blocks() {
        return casting.myBlocks();
    }

    @DeleteMapping("/casting-blocks/{agencyUserId}")
    public Map<String, Boolean> unblock(@PathVariable UUID agencyUserId) {
        casting.unblockAgency(agencyUserId);
        return Map.of("ok", true);
    }
}
