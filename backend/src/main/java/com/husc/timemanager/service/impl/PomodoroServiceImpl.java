package com.husc.timemanager.service.impl;

import com.husc.timemanager.dto.request.PomodoroSessionDTO;
import com.husc.timemanager.dto.response.PomodoroSessionResponseDTO;
import com.husc.timemanager.dto.response.PomodoroStatsDTO;
import com.husc.timemanager.model.entity.PomodoroSession;
import com.husc.timemanager.model.entity.User;
import com.husc.timemanager.model.enums.PomodoroStatus;
import com.husc.timemanager.repository.PomodoroSessionRepository;
import com.husc.timemanager.repository.TaskRepository;
import com.husc.timemanager.service.PomodoroService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PomodoroServiceImpl implements PomodoroService {

    private final PomodoroSessionRepository pomodoroSessionRepository;
    private final TaskRepository taskRepository;

    @Override
    @Transactional
    public PomodoroSessionResponseDTO saveSession(PomodoroSessionDTO dto, User user) {
        PomodoroSession session = new PomodoroSession();
        session.setUser(user);
        session.setDurationMinutes(dto.getDurationMinutes());
        session.setStartTime(dto.getStartTime() != null ? dto.getStartTime() : LocalDateTime.now().minusMinutes(dto.getDurationMinutes()));
        session.setEndTime(dto.getEndTime() != null ? dto.getEndTime() : LocalDateTime.now());
        session.setStatus(dto.getStatus() != null ? dto.getStatus() : PomodoroStatus.COMPLETED);

        // LiĂªn káº¿t task náº¿u cĂ³
        if (dto.getTaskId() != null) {
            taskRepository.findById(dto.getTaskId()).ifPresent(session::setTask);
        }

        PomodoroSession saved = pomodoroSessionRepository.save(session);
        return mapToResponseDTO(saved);
    }

    @Override
    public List<PomodoroSessionResponseDTO> getSessionsByUser(Long userId) {
        List<PomodoroSession> sessions = pomodoroSessionRepository.findByUserId(userId);
        return sessions.stream()
                .sorted(Comparator.comparing(PomodoroSession::getCreatedAt).reversed())
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public PomodoroStatsDTO getStats(Long userId) {
        List<PomodoroSession> allSessions = pomodoroSessionRepository.findByUserId(userId);

        LocalDate today = LocalDate.now();

        long totalSessions = allSessions.stream()
                .filter(s -> s.getStatus() == PomodoroStatus.COMPLETED)
                .count();

        long todaySessions = allSessions.stream()
                .filter(s -> s.getStatus() == PomodoroStatus.COMPLETED)
                .filter(s -> s.getCreatedAt() != null && s.getCreatedAt().toLocalDate().equals(today))
                .count();

        long totalMinutes = allSessions.stream()
                .filter(s -> s.getStatus() == PomodoroStatus.COMPLETED)
                .mapToLong(PomodoroSession::getDurationMinutes)
                .sum();

        long todayMinutes = allSessions.stream()
                .filter(s -> s.getStatus() == PomodoroStatus.COMPLETED)
                .filter(s -> s.getCreatedAt() != null && s.getCreatedAt().toLocalDate().equals(today))
                .mapToLong(PomodoroSession::getDurationMinutes)
                .sum();

        return new PomodoroStatsDTO(totalSessions, todaySessions, totalMinutes, todayMinutes);
    }

    private PomodoroSessionResponseDTO mapToResponseDTO(PomodoroSession session) {
        PomodoroSessionResponseDTO dto = new PomodoroSessionResponseDTO();
        dto.setId(session.getId());
        dto.setDurationMinutes(session.getDurationMinutes());
        dto.setStartTime(session.getStartTime());
        dto.setEndTime(session.getEndTime());
        dto.setStatus(session.getStatus());
        dto.setCreatedAt(session.getCreatedAt());
        if (session.getTask() != null) {
            dto.setTaskId(session.getTask().getId());
            dto.setTaskTitle(session.getTask().getTitle());
        }
        return dto;
    }
}
