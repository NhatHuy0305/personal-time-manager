package com.husc.timemanager.service;

import com.husc.timemanager.dto.request.PomodoroSessionDTO;
import com.husc.timemanager.dto.response.PomodoroSessionResponseDTO;
import com.husc.timemanager.dto.response.PomodoroStatsDTO;
import com.husc.timemanager.model.entity.User;

import java.util.List;

public interface PomodoroService {
    PomodoroSessionResponseDTO saveSession(PomodoroSessionDTO dto, User user);
    List<PomodoroSessionResponseDTO> getSessionsByUser(Long userId);
    PomodoroStatsDTO getStats(Long userId);
}
