package com.husc.timemanager.dto.request;

import com.husc.timemanager.model.enums.PomodoroStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PomodoroSessionDTO {
    private Integer durationMinutes;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private PomodoroStatus status;
    private Long taskId; // nullable
}
