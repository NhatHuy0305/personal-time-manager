package com.husc.timemanager.repository;

import com.husc.timemanager.model.entity.PomodoroSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PomodoroSessionRepository extends JpaRepository<PomodoroSession, Long> {
    // Lấy lịch sử các phiên Pomodoro của một user (dùng để tính toán báo cáo hiệu suất)
    List<PomodoroSession> findByUserId(Long userId);

    // Lấy các phiên trong khoảng thời gian
    List<PomodoroSession> findByUserIdAndCreatedAtBetween(Long userId, LocalDateTime from, LocalDateTime to);
}