package com.husc.timemanager.dto.request;

import com.husc.timemanager.model.enums.HabitLogStatus;
import lombok.Data;
import java.time.LocalDate;

@Data
public class HabitLogDTO {
    private Long id;
    private Long habitId;
    private LocalDate logDate;
    private HabitLogStatus status;
}
