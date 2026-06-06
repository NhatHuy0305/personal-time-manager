package com.husc.timemanager.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PomodoroStatsDTO {
    private long totalSessions;       // tá»•ng sá»‘ phiĂªn táº¥t cáº£ thá»i gian
    private long todaySessions;       // sá»‘ phiĂªn hĂ´m nay
    private long totalMinutes;        // tá»•ng phĂºt táº­p trung táº¥t cáº£ thá»i gian
    private long todayMinutes;        // tá»•ng phĂºt táº­p trung hĂ´m nay
}
