package com.husc.timemanager.service;

import com.husc.timemanager.dto.response.ReportSummaryDTO;

import java.time.LocalDate;

public interface ReportService {
    ReportSummaryDTO getReportSummary(Long userId, LocalDate from, LocalDate to);
}
