package com.husc.timemanager.controller;

import com.husc.timemanager.security.CustomUserDetails;
import com.husc.timemanager.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ResponseEntity<?> getDashboardStats(@AuthenticationPrincipal CustomUserDetails currentUser) {
        return ResponseEntity.ok(dashboardService.getDashboardStats(currentUser.getUser().getId()));
    }
}