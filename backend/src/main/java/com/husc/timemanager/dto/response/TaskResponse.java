package com.husc.timemanager.dto.response;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class TaskResponse {
    private Long id;
    private String title;
    private String description;
    private LocalDateTime dueDate;
    private LocalDateTime reminderTime;
    private Integer priority;
    private String status;
    private boolean completed;

    // ÄĂ‚Y LĂ€ DĂ’NG Báº N Cáº¦N THĂM VĂ€O:
    private String eisenhowerMatrix;

    // Sá»­ dá»¥ng CategoryResponse á»Ÿ Ä‘Ă¢y
    private CategoryResponse category;
}
