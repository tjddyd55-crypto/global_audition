package com.audition.platform.application.org;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

/**
 * 귀속 국가는 오디션을 게시한 계약 지점이다. 지원자 국적은 입력으로 받아도 결과에 쓰지 않는다.
 * 크레딧 사용(SALES)의 현금 환산은 UNDECIDED 이며 collected_usd 를 채우지 않는다.
 */
public final class AttributionPlanner {

    public static final String ATTRIBUTED = "ATTRIBUTED";
    public static final String NEEDS_CONFIRMATION = "NEEDS_CONFIRMATION";
    public static final String SALES = "SALES";
    public static final String ACCOUNTING = "ACCOUNTING";
    public static final String CASH_MAPPING_UNDECIDED = "UNDECIDED";
    public static final String CASH_MAPPING_COLLECTED = "CASH_COLLECTED";

    private AttributionPlanner() {
    }

    public record Window(
            UUID contractId,
            UUID versionId,
            int versionNo,
            String countryCode,
            UUID branchId,
            LocalDate start,
            LocalDate end) {
    }

    public record Input(
            String recognition,
            UUID branchId,
            String applicantCountry,
            LocalDate occurredOn,
            Long collectedUsd,
            List<Window> windows) {
    }

    public record Plan(
            String confirmationState,
            String attributedCountry,
            UUID contractId,
            UUID contractVersionId,
            Long collectedUsd,
            String cashMappingPolicy,
            String note) {
    }

    public static Plan plan(Input input) {
        List<Window> covering = input.windows().stream()
                .filter(window -> covers(window, input.occurredOn()))
                .filter(window -> input.branchId() == null || input.branchId().equals(window.branchId()))
                .toList();
        if (input.branchId() == null) {
            long branches = covering.stream().map(Window::branchId).distinct().count();
            if (branches > 1) {
                return undecided(input, "BRANCH_UNCONFIRMED");
            }
        }
        if (covering.isEmpty()) {
            return undecided(input, "NO_CONTRACT_VERSION");
        }
        long contracts = covering.stream().map(Window::contractId).distinct().count();
        if (contracts > 1) {
            return undecided(input, "MULTIPLE_CONTRACTS");
        }
        Window chosen = covering.stream().max(Comparator.comparingInt(Window::versionNo)).orElseThrow();
        boolean sales = SALES.equals(input.recognition());
        return new Plan(
                ATTRIBUTED,
                chosen.countryCode(),
                chosen.contractId(),
                chosen.versionId(),
                sales ? null : input.collectedUsd(),
                sales ? CASH_MAPPING_UNDECIDED : CASH_MAPPING_COLLECTED,
                sales ? "SALES_FEE_IS_NOT_CASH" : "CASH_COLLECTION");
    }

    public static boolean covers(Window window, LocalDate day) {
        if (day.isBefore(window.start())) {
            return false;
        }
        return window.end() == null || !day.isAfter(window.end());
    }

    private static Plan undecided(Input input, String note) {
        boolean sales = SALES.equals(input.recognition());
        return new Plan(
                NEEDS_CONFIRMATION,
                null,
                null,
                null,
                sales ? null : input.collectedUsd(),
                sales ? CASH_MAPPING_UNDECIDED : CASH_MAPPING_COLLECTED,
                note);
    }
}
