package com.audition.platform.api;

import com.audition.platform.api.dto.ApplicationFeeHistoryView;
import com.audition.platform.api.dto.ApplicationFeePatchRequest;
import com.audition.platform.api.dto.ApplicationFeeView;
import com.audition.platform.application.fee.GlobalApplicationFeeService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/application-fee")
public class AdminApplicationFeeController {

    private final GlobalApplicationFeeService globalApplicationFeeService;

    public AdminApplicationFeeController(GlobalApplicationFeeService globalApplicationFeeService) {
        this.globalApplicationFeeService = globalApplicationFeeService;
    }

    @GetMapping
    public ApplicationFeeView get() {
        return globalApplicationFeeService.view();
    }

    @GetMapping("/history")
    public List<ApplicationFeeHistoryView> history() {
        return globalApplicationFeeService.history();
    }

    @PatchMapping
    public ApplicationFeeView patch(@RequestBody ApplicationFeePatchRequest request) {
        return globalApplicationFeeService.update(request.getAmountUsd());
    }
}
