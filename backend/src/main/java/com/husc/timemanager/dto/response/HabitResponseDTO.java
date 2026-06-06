package com.husc.timemanager.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class HabitResponseDTO {
    private Long id;
    private String name;
    private String description;
    private Integer currentStreak;
    private Integer longestStreak;
    private LocalDateTime createdAt;
}
