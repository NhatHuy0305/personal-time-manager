package com.husc.timemanager.service;

import com.husc.timemanager.dto.response.DashboardResponse;

public interface DashboardService {
    DashboardResponse getDashboardStats(Long userId);
}