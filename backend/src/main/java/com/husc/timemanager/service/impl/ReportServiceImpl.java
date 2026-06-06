package com.husc.timemanager.service.impl;

import com.husc.timemanager.dto.response.ReportSummaryDTO;
import com.husc.timemanager.dto.response.CategoryTaskCount;
import com.husc.timemanager.model.entity.Habit;
import com.husc.timemanager.model.entity.HabitLog;
import com.husc.timemanager.model.enums.HabitLogStatus;
import com.husc.timemanager.model.entity.PomodoroSession;
import com.husc.timemanager.model.entity.Task;
import com.husc.timemanager.repository.HabitLogRepository;
import com.husc.timemanager.repository.HabitRepository;
import com.husc.timemanager.repository.PomodoroSessionRepository;
import com.husc.timemanager.repository.TaskRepository;
import com.husc.timemanager.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final TaskRepository taskRepository;
    private final PomodoroSessionRepository pomodoroRepository;
    private final HabitRepository habitRepository;
    private final HabitLogRepository habitLogRepository;

    @Override
    public ReportSummaryDTO getReportSummary(Long userId, LocalDate from, LocalDate to) {
        LocalDateTime fromTime = from.atStartOfDay();
        LocalDateTime toTime = to.atTime(LocalTime.MAX);

        ReportSummaryDTO.TaskStats taskStats = buildTaskStats(userId, fromTime, toTime, from, to);
        ReportSummaryDTO.PomodoroStats pomodoroStats = buildPomodoroStats(userId, fromTime, toTime, from, to);
        List<ReportSummaryDTO.HabitStats> habitStats = buildHabitStats(userId, from, to);

        return ReportSummaryDTO.builder()
                .taskStats(taskStats)
                .pomodoroStats(pomodoroStats)
                .habitStats(habitStats)
                .build();
    }

    private ReportSummaryDTO.TaskStats buildTaskStats(Long userId, LocalDateTime fromTime, LocalDateTime toTime, LocalDate fromDate, LocalDate toDate) {
        List<Task> allTasks = taskRepository.findAllBetween(userId, fromTime, toTime);
        long total = allTasks.size();
        long completed = allTasks.stream().filter(Task::isCompleted).count();
        long pending = total - completed;
        long overdue = allTasks.stream()
                .filter(t -> !t.isCompleted() && t.getDueDate() != null && t.getDueDate().isBefore(LocalDateTime.now()))
                .count();

        double completionRate = total > 0 ? (double) completed / total * 100 : 0;

        Map<String, Long> categoryMap = allTasks.stream()
                .filter(t -> t.getCategory() != null)
                .collect(Collectors.groupingBy(t -> t.getCategory().getName(), Collectors.counting()));
        List<CategoryTaskCount> byCategory = categoryMap.entrySet().stream()
                .map(e -> new CategoryTaskCount(e.getKey(), e.getValue()))
                .collect(Collectors.toList());

        Map<String, Integer> completedByDate = new HashMap<>();
        for (LocalDate d = fromDate; !d.isAfter(toDate); d = d.plusDays(1)) {
            completedByDate.put(d.format(DateTimeFormatter.ISO_LOCAL_DATE), 0);
        }

        List<Task> completedTasks = taskRepository.findCompletedBetween(userId, fromTime, toTime);
        for (Task t : completedTasks) {
            if (t.getDueDate() != null) {
                String dateStr = t.getDueDate().toLocalDate().format(DateTimeFormatter.ISO_LOCAL_DATE);
                if (completedByDate.containsKey(dateStr)) {
                    completedByDate.put(dateStr, completedByDate.get(dateStr) + 1);
                }
            }
        }

        List<ReportSummaryDTO.DailyData> completedTrend = completedByDate.entrySet().stream()
                .map(e -> ReportSummaryDTO.DailyData.builder().date(e.getKey()).value(e.getValue()).build())
                .sorted(Comparator.comparing(ReportSummaryDTO.DailyData::getDate))
                .collect(Collectors.toList());

        return ReportSummaryDTO.TaskStats.builder()
                .total(total)
                .completed(completed)
                .pending(pending)
                .overdue(overdue)
                .completionRate(Math.round(completionRate * 10.0) / 10.0)
                .byCategory(byCategory)
                .completedTrend(completedTrend)
                .build();
    }

    private ReportSummaryDTO.PomodoroStats buildPomodoroStats(Long userId, LocalDateTime fromTime, LocalDateTime toTime, LocalDate fromDate, LocalDate toDate) {
        List<PomodoroSession> sessions = pomodoroRepository.findByUserIdAndCreatedAtBetween(userId, fromTime, toTime);
        long totalSessions = sessions.size();
        long totalMinutes = sessions.stream().mapToLong(PomodoroSession::getDurationMinutes).sum();

        LocalDate today = LocalDate.now();
        long todaySessions = sessions.stream()
                .filter(s -> s.getCreatedAt().toLocalDate().isEqual(today))
                .count();

        Map<String, Integer> minutesByDate = new HashMap<>();
        for (LocalDate d = fromDate; !d.isAfter(toDate); d = d.plusDays(1)) {
            minutesByDate.put(d.format(DateTimeFormatter.ISO_LOCAL_DATE), 0);
        }

        for (PomodoroSession s : sessions) {
            String dateStr = s.getCreatedAt().toLocalDate().format(DateTimeFormatter.ISO_LOCAL_DATE);
            if (minutesByDate.containsKey(dateStr)) {
                minutesByDate.put(dateStr, minutesByDate.get(dateStr) + s.getDurationMinutes());
            }
        }

        List<ReportSummaryDTO.DailyData> durationTrend = minutesByDate.entrySet().stream()
                .map(e -> ReportSummaryDTO.DailyData.builder().date(e.getKey()).value(e.getValue()).build())
                .sorted(Comparator.comparing(ReportSummaryDTO.DailyData::getDate))
                .collect(Collectors.toList());

        return ReportSummaryDTO.PomodoroStats.builder()
                .totalSessions(totalSessions)
                .totalMinutes(totalMinutes)
                .todaySessions(todaySessions)
                .durationTrend(durationTrend)
                .build();
    }

    private List<ReportSummaryDTO.HabitStats> buildHabitStats(Long userId, LocalDate fromDate, LocalDate toDate) {
        List<Habit> habits = habitRepository.findByUserId(userId);
        List<ReportSummaryDTO.HabitStats> habitStatsList = new ArrayList<>();

        long totalDays = ChronoUnit.DAYS.between(fromDate, toDate) + 1;

        for (Habit h : habits) {
            List<HabitLog> logs = habitLogRepository.findByHabitIdAndLogDateBetween(h.getId(), fromDate, toDate);
            int completedDays = (int) logs.stream().filter(l -> l.getStatus() == HabitLogStatus.COMPLETED).count();
            double completionRate = totalDays > 0 ? (double) completedDays / totalDays * 100 : 0;

            habitStatsList.add(ReportSummaryDTO.HabitStats.builder()
                    .habitId(h.getId())
                    .name(h.getName())
                    .currentStreak(h.getCurrentStreak() != null ? h.getCurrentStreak() : 0)
                    .longestStreak(h.getLongestStreak() != null ? h.getLongestStreak() : 0)
                    .completionRate(Math.round(completionRate * 10.0) / 10.0)
                    .completedDays(completedDays)
                    .build());
        }

        return habitStatsList;
    }
}
