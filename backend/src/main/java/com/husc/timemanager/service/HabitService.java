package com.husc.timemanager.service;

import com.husc.timemanager.dto.request.HabitDTO;
import com.husc.timemanager.dto.request.HabitLogDTO;
import com.husc.timemanager.dto.response.HabitResponseDTO;
import com.husc.timemanager.model.entity.User;

import java.time.LocalDate;
import java.util.List;

public interface HabitService {
    HabitResponseDTO createHabit(HabitDTO habitDTO, User user);
    HabitResponseDTO updateHabit(Long id, HabitDTO habitDTO, User user);
    void deleteHabit(Long id, User user);
    List<HabitResponseDTO> getHabitsByUser(Long userId);
    HabitLogDTO checkInHabit(Long habitId, LocalDate date, User user);
    List<HabitLogDTO> getHabitLogs(Long habitId, User user);
}
