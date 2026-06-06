package com.husc.timemanager.service.impl;

import com.husc.timemanager.dto.request.HabitDTO;
import com.husc.timemanager.dto.request.HabitLogDTO;
import com.husc.timemanager.dto.response.HabitResponseDTO;
import com.husc.timemanager.exception.ResourceNotFoundException;
import com.husc.timemanager.model.entity.Habit;
import com.husc.timemanager.model.entity.HabitLog;
import com.husc.timemanager.model.entity.User;
import com.husc.timemanager.model.enums.HabitLogStatus;
import com.husc.timemanager.repository.HabitLogRepository;
import com.husc.timemanager.repository.HabitRepository;
import com.husc.timemanager.service.HabitService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HabitServiceImpl implements HabitService {

    private final HabitRepository habitRepository;
    private final HabitLogRepository habitLogRepository;

    @Override
    @Transactional
    public HabitResponseDTO createHabit(HabitDTO habitDTO, User user) {
        Habit habit = new Habit();
        habit.setName(habitDTO.getName());
        habit.setDescription(habitDTO.getDescription());
        habit.setUser(user);
        habit.setCurrentStreak(0);
        habit.setLongestStreak(0);

        Habit savedHabit = habitRepository.save(habit);
        return mapToResponseDTO(savedHabit);
    }

    @Override
    @Transactional
    public HabitResponseDTO updateHabit(Long id, HabitDTO habitDTO, User user) {
        Habit habit = getHabitByIdAndUser(id, user);
        habit.setName(habitDTO.getName());
        habit.setDescription(habitDTO.getDescription());
        return mapToResponseDTO(habitRepository.save(habit));
    }

    @Override
    @Transactional
    public void deleteHabit(Long id, User user) {
        Habit habit = getHabitByIdAndUser(id, user);
        // XĂ³a logs trÆ°á»›c náº¿u cáº¥u hĂ¬nh cascade chÆ°a Ä‘á»§
        List<HabitLog> logs = habitLogRepository.findByHabitId(habit.getId());
        habitLogRepository.deleteAll(logs);
        
        habitRepository.delete(habit);
    }

    @Override
    public List<HabitResponseDTO> getHabitsByUser(Long userId) {
        List<Habit> habits = habitRepository.findByUserId(userId);
        // Cáº­p nháº­t láº¡i streak náº¿u ngÆ°á»i dĂ¹ng bá» lá»¡ ngĂ y hĂ´m qua (Ä‘á»ƒ giao diá»‡n tháº¥y ngay streak = 0)
        boolean hasUpdates = false;
        for (Habit habit : habits) {
            if (habit.getCurrentStreak() > 0) {
                List<HabitLog> logs = habitLogRepository.findByHabitId(habit.getId());
                LocalDate lastDate = logs.stream()
                        .map(HabitLog::getLogDate)
                        .max(LocalDate::compareTo)
                        .orElse(null);
                
                if (lastDate != null) {
                    long daysSinceLastLog = ChronoUnit.DAYS.between(lastDate, LocalDate.now());
                    if (daysSinceLastLog > 1) {
                        habit.setCurrentStreak(0);
                        hasUpdates = true;
                    }
                }
            }
        }
        
        if (hasUpdates) {
            habitRepository.saveAll(habits);
        }

        return habits.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public HabitLogDTO checkInHabit(Long habitId, LocalDate date, User user) {
        Habit habit = getHabitByIdAndUser(habitId, user);
        
        // TrĂ¡nh check-in 2 láº§n 1 ngĂ y
        Optional<HabitLog> existingLog = habitLogRepository.findByHabitIdAndLogDate(habitId, date);
        HabitLog log;
        if (existingLog.isPresent()) {
            // Náº¿u Ä‘Ă£ check-in rá»“i mĂ  báº¥m ná»¯a thĂ¬ cĂ³ thá»ƒ coi nhÆ° há»§y check-in (toggle)
            habitLogRepository.delete(existingLog.get());
        } else {
            // Táº¡o má»›i log
            log = new HabitLog();
            log.setHabit(habit);
            log.setLogDate(date);
            log.setStatus(HabitLogStatus.COMPLETED);
            habitLogRepository.save(log);
        }

        recalculateStreaks(habit);
        
        // Tráº£ vá» log hiá»‡n táº¡i náº¿u tá»“n táº¡i, hoáº·c null náº¿u vá»«a toggle xĂ³a
        Optional<HabitLog> newLog = habitLogRepository.findByHabitIdAndLogDate(habitId, date);
        return newLog.map(this::mapToLogDTO).orElse(null);
    }

    @Override
    public List<HabitLogDTO> getHabitLogs(Long habitId, User user) {
        Habit habit = getHabitByIdAndUser(habitId, user);
        List<HabitLog> logs = habitLogRepository.findByHabitId(habit.getId());
        return logs.stream().map(this::mapToLogDTO).collect(Collectors.toList());
    }

    private Habit getHabitByIdAndUser(Long id, User user) {
        Habit habit = habitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("KhĂ´ng tĂ¬m tháº¥y thĂ³i quen vá»›i ID: " + id));
        if (!habit.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Báº¡n khĂ´ng cĂ³ quyá»n truy cáº­p thĂ³i quen nĂ y");
        }
        return habit;
    }

    private void recalculateStreaks(Habit habit) {
        List<HabitLog> logs = habitLogRepository.findByHabitId(habit.getId());
        logs.sort(Comparator.comparing(HabitLog::getLogDate));
        
        int currentStreak = 0;
        int longestStreak = 0;
        LocalDate lastDate = null;
        
        for (HabitLog log : logs) {
            if (lastDate == null) {
                currentStreak = 1;
            } else {
                long daysBetween = ChronoUnit.DAYS.between(lastDate, log.getLogDate());
                if (daysBetween == 1) {
                    currentStreak++;
                } else if (daysBetween > 1) {
                    currentStreak = 1; // Reset
                }
            }
            if (currentStreak > longestStreak) {
                longestStreak = currentStreak;
            }
            lastDate = log.getLogDate();
        }
        
        if (lastDate != null) {
            long daysSinceLastLog = ChronoUnit.DAYS.between(lastDate, LocalDate.now());
            if (daysSinceLastLog > 1) {
                currentStreak = 0; // QuĂ¡ 1 ngĂ y chÆ°a checkin => máº¥t chuá»—i
            }
        }
        
        habit.setCurrentStreak(currentStreak);
        if (longestStreak > habit.getLongestStreak()) {
            habit.setLongestStreak(longestStreak);
        }
        
        habitRepository.save(habit);
    }

    private HabitResponseDTO mapToResponseDTO(Habit habit) {
        HabitResponseDTO dto = new HabitResponseDTO();
        dto.setId(habit.getId());
        dto.setName(habit.getName());
        dto.setDescription(habit.getDescription());
        dto.setCurrentStreak(habit.getCurrentStreak());
        dto.setLongestStreak(habit.getLongestStreak());
        dto.setCreatedAt(habit.getCreatedAt());
        return dto;
    }

    private HabitLogDTO mapToLogDTO(HabitLog log) {
        HabitLogDTO dto = new HabitLogDTO();
        dto.setId(log.getId());
        dto.setHabitId(log.getHabit().getId());
        dto.setLogDate(log.getLogDate());
        dto.setStatus(log.getStatus());
        return dto;
    }
}
