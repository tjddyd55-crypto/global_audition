package com.audition.platform.application.credit;

import com.audition.platform.api.dto.CreditTransactionDto;
import com.audition.platform.domain.credit.CreditTransaction;

public final class CreditTransactionMapper {

    private CreditTransactionMapper() {
    }

    public static CreditTransactionDto toDto(CreditTransaction t) {
        CreditTransactionDto d = new CreditTransactionDto();
        d.setId(t.getId().toString());
        d.setUserId(t.getUserId().toString());
        d.setAmount(t.getAmount());
        d.setType(t.getType());
        d.setReason(t.getReason());
        d.setReferenceId(t.getReferenceId());
        d.setGrantedBy(t.getGrantedBy() != null ? t.getGrantedBy().toString() : null);
        d.setNote(t.getNote());
        d.setBeforeBalance(t.getBeforeBalance());
        d.setAfterBalance(t.getAfterBalance());
        d.setCreatedAt(t.getCreatedAt());
        return d;
    }
}
