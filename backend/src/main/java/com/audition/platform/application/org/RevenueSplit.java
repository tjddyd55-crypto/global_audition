package com.audition.platform.application.org;

import java.util.List;

/**
 * 현금 수납과 크레딧 사용 스냅샷을 한 매출 숫자로 더하지 않는다.
 * 사용분의 현금 환산이 UNDECIDED 이면 salesCashUsd 는 null 이다.
 */
public final class RevenueSplit {

    private RevenueSplit() {
    }

    public record Line(String recognition, String kind, Long collectedUsd, Long appliedFeeUsd) {
    }

    public record Totals(long accountingCashUsd, long salesFeeSnapshotUsd, Long salesCashUsd, String salesCashNote) {
    }

    public static Totals totals(List<Line> lines) {
        long accounting = 0;
        long snapshot = 0;
        boolean salesPresent = false;
        for (Line line : lines) {
            if (AttributionPlanner.ACCOUNTING.equals(line.recognition()) && "REVENUE".equals(line.kind())) {
                accounting += line.collectedUsd() == null ? 0 : line.collectedUsd();
            } else if (AttributionPlanner.ACCOUNTING.equals(line.recognition()) && "REFUND".equals(line.kind())) {
                accounting -= line.collectedUsd() == null ? 0 : line.collectedUsd();
            } else if (AttributionPlanner.SALES.equals(line.recognition()) && "REVENUE".equals(line.kind())) {
                salesPresent = true;
                snapshot += line.appliedFeeUsd() == null ? 0 : line.appliedFeeUsd();
            }
        }
        if (salesPresent) {
            return new Totals(accounting, snapshot, null, AttributionPlanner.CASH_MAPPING_UNDECIDED);
        }
        return new Totals(accounting, 0, 0L, "NO_SALES_USAGE");
    }
}
