package com.husc.timemanager.dto.response;

import com.husc.timemanager.model.enums.PomodoroStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PomodoroSessionResponseDTO {
    private Long id;
    private Integer durationMinutes;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private PomodoroStatus status;
    private Long taskId;
    private String taskTitle; // tĂªn task liĂªn káº¿t (náº¿u cĂ³)
    private LocalDateTime createdAt;
}
