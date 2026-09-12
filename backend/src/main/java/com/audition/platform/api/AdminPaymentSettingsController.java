package com.audition.platform.api;

import com.audition.platform.api.dto.payment.PaymentConnectionTestResult;
import com.audition.platform.api.dto.payment.PaymentSettingsPatchRequest;
import com.audition.platform.api.dto.payment.PaymentSettingsView;
import com.audition.platform.application.payment.PaymentSettingsService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/payment-settings")
public class AdminPaymentSettingsController {

    private final PaymentSettingsService paymentSettingsService;

    public AdminPaymentSettingsController(PaymentSettingsService paymentSettingsService) {
        this.paymentSettingsService = paymentSettingsService;
    }

    @GetMapping
    public PaymentSettingsView get() {
        return paymentSettingsService.view();
    }

    @PatchMapping
    public PaymentSettingsView patch(@Valid @RequestBody PaymentSettingsPatchRequest request) {
        return paymentSettingsService.update(request);
    }

    @PostMapping("/connection-test")
    public PaymentConnectionTestResult connectionTest() {
        return paymentSettingsService.testConnection();
    }
}
