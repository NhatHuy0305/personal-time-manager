package com.husc.timemanager.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ReportSummaryDTO {
    private TaskStats taskStats;
    private PomodoroStats pomodoroStats;
    private List<HabitStats> habitStats;

    @Data
    @Builder
    public static class TaskStats {
        private long total;
        private long completed;
        private long pending;
        private long overdue;
        private double completionRate;
        private List<CategoryTaskCount> byCategory;
        private List<DailyData> completedTrend; 
    }

    @Data
    @Builder
    public static class PomodoroStats {
        private long totalSessions;
        private long totalMinutes;
        private long todaySessions;
        private List<DailyData> durationTrend; 
    }

    @Data
    @Builder
    public static class HabitStats {
        private Long habitId;
        private String name;
        private int currentStreak;
        private int longestStreak;
        private double completionRate;
        private int completedDays;
    }

    @Data
    @Builder
    public static class DailyData {
        private String date; // Format: YYYY-MM-DD
        private int value;
    }
}
