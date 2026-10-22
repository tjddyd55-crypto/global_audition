package com.audition.platform.api.dto;

import java.math.BigDecimal;

public class ApplicationFeePatchRequest {

    private BigDecimal amountUsd;

    public BigDecimal getAmountUsd() { return amountUsd; }
    public void setAmountUsd(BigDecimal amountUsd) { this.amountUsd = amountUsd; }
}
