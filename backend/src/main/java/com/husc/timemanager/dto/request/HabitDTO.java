package com.husc.timemanager.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class HabitDTO {
    @NotBlank(message = "TĂªn thĂ³i quen khĂ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng")
    private String name;

    private String description;
}
