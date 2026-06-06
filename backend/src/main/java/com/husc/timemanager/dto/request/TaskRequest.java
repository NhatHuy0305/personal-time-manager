package com.husc.timemanager.dto.request;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class TaskRequest {
    private String title;
    private String description;
    private LocalDateTime dueDate;
    private LocalDateTime reminderTime;

    private Integer priority;

    private Long categoryId;
    private String status;
    private String eisenhowerMatrix;
}
