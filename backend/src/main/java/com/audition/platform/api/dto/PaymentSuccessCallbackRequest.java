package com.audition.platform.api.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;

public class PaymentSuccessCallbackRequest {

    @NotBlank
    private String orderNo;

    private String providerTxId;

    private JsonNode payload;

    public String getOrderNo() {
        return orderNo;
    }

    public void setOrderNo(String orderNo) {
        this.orderNo = orderNo;
    }

    public String getProviderTxId() {
        return providerTxId;
    }

    public void setProviderTxId(String providerTxId) {
        this.providerTxId = providerTxId;
    }

    public JsonNode getPayload() {
        return payload;
    }

    public void setPayload(JsonNode payload) {
        this.payload = payload;
    }
}
