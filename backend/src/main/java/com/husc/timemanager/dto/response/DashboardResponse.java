package com.husc.timemanager.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class DashboardResponse {
    private long totalTasks;
    private long completedTasks;
    private long pendingTasks; // CĂ´ng viá»‡c chÆ°a xong
    private List<CategoryTaskCount> tasksByCategory; // Danh sĂ¡ch thá»‘ng kĂª theo danh má»¥c
}
