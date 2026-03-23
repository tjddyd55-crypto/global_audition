package com.audition.platform.application.payment;

import com.audition.platform.api.dto.PaymentOrderAdminDto;
import com.audition.platform.application.credit.SuperAdminAuthHelper;
import com.audition.platform.domain.payment.PaymentOrder;
import com.audition.platform.domain.payment.PaymentOrderRepository;
import com.audition.platform.domain.payment.PaymentOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class SuperAdminPaymentOrderQueryService {

    private final PaymentOrderRepository paymentOrderRepository;

    public SuperAdminPaymentOrderQueryService(PaymentOrderRepository paymentOrderRepository) {
        this.paymentOrderRepository = paymentOrderRepository;
    }

    @Transactional(readOnly = true)
    public Page<PaymentOrderAdminDto> list(UUID userId, PaymentOrderStatus status, Pageable pageable) {
        SuperAdminAuthHelper.requireSuperAdmin();
        Specification<PaymentOrder> spec = (root, query, cb) -> cb.conjunction();
        if (userId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("userId"), userId));
        }
        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        return paymentOrderRepository.findAll(spec, pageable).map(SuperAdminPaymentOrderQueryService::toDto);
    }

    private static PaymentOrderAdminDto toDto(PaymentOrder p) {
        PaymentOrderAdminDto d = new PaymentOrderAdminDto();
        d.setId(p.getId());
        d.setOrderNo(p.getOrderNo());
        d.setUserId(p.getUserId());
        d.setPackageId(p.getPackageId());
        d.setProvider(p.getProvider());
        d.setAmount(p.getAmount());
        d.setCurrency(p.getCurrency());
        d.setStatus(p.getStatus() != null ? p.getStatus().name() : null);
        d.setCredits(p.getCredits());
        d.setBonusCredits(p.getBonusCredits());
        d.setPaidAt(p.getPaidAt());
        d.setProviderTxId(p.getProviderTxId());
        d.setFailReason(p.getFailReason());
        d.setCreatedAt(p.getCreatedAt());
        d.setUpdatedAt(p.getUpdatedAt());
        return d;
    }
}
