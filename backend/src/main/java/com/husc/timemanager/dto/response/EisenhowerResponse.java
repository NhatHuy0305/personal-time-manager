package com.husc.timemanager.dto.response;

import lombok.Data;
import java.util.List;

@Data
public class EisenhowerResponse {
    private List<TaskResponse> doFirst;     // Q1: Quan trá»ng & Kháº©n cáº¥p
    private List<TaskResponse> schedule;    // Q2: Quan trá»ng & KHĂ”NG Kháº©n cáº¥p
    private List<TaskResponse> delegate;    // Q3: KHĂ”NG Quan trá»ng & Kháº©n cáº¥p
    private List<TaskResponse> eliminate;   // Q4: KHĂ”NG Quan trá»ng & KHĂ”NG Kháº©n cáº¥p
}
